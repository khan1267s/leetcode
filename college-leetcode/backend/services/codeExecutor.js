const Docker = require('dockerode');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const docker = new Docker();

// Language configurations
const languageConfig = {
  c: {
    dockerImage: 'gcc:latest',
    fileExtension: '.c',
    compileCommand: (filename) => `gcc -o /tmp/program ${filename} -lm`,
    runCommand: '/tmp/program',
    needsCompilation: true
  },
  cpp: {
    dockerImage: 'gcc:latest',
    fileExtension: '.cpp',
    compileCommand: (filename) => `g++ -o /tmp/program ${filename} -std=c++17`,
    runCommand: '/tmp/program',
    needsCompilation: true
  }
};

class CodeExecutor {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.initTempDir();
  }

  async initTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  async executeCode(code, language, input, timeLimit = 5000, memoryLimit = 256) {
    const executionId = crypto.randomBytes(16).toString('hex');
    const config = languageConfig[language];
    
    if (!config) {
      throw new Error('Unsupported language');
    }

    const codeFile = path.join(this.tempDir, `${executionId}${config.fileExtension}`);
    const inputFile = path.join(this.tempDir, `${executionId}.in`);

    try {
      // Write code and input to files
      await fs.writeFile(codeFile, code);
      await fs.writeFile(inputFile, input);

      // Create container
      const container = await docker.createContainer({
        Image: config.dockerImage,
        Cmd: ['sh', '-c', this.buildCommand(config, `/tmp/code${config.fileExtension}`)],
        WorkingDir: '/tmp',
        AttachStdout: true,
        AttachStderr: true,
        HostConfig: {
          AutoRemove: true,
          Memory: memoryLimit * 1024 * 1024, // Convert MB to bytes
          CpuQuota: 50000, // 50% CPU
          ReadonlyRootfs: true,
          Tmpfs: {
            '/tmp': 'rw,noexec,nosuid,size=50m'
          },
          Binds: [
            `${codeFile}:/tmp/code${config.fileExtension}:ro`,
            `${inputFile}:/tmp/input.txt:ro`
          ]
        }
      });

      // Start container and attach streams
      const stream = await container.attach({ stream: true, stdout: true, stderr: true });
      await container.start();

      // Set up timeout
      const timeout = setTimeout(() => {
        container.kill().catch(console.error);
      }, timeLimit);

      // Collect output
      const output = await this.collectOutput(stream);
      clearTimeout(timeout);

      // Wait for container to finish
      const exitCode = await container.wait();

      return {
        success: exitCode.StatusCode === 0,
        output: output.stdout,
        error: output.stderr,
        exitCode: exitCode.StatusCode,
        timedOut: false
      };

    } catch (error) {
      if (error.message.includes('Container killed')) {
        return {
          success: false,
          output: '',
          error: 'Time Limit Exceeded',
          exitCode: -1,
          timedOut: true
        };
      }
      throw error;
    } finally {
      // Clean up files
      await fs.unlink(codeFile).catch(() => {});
      await fs.unlink(inputFile).catch(() => {});
    }
  }

  buildCommand(config, codeFile) {
    let command = '';
    
    if (config.needsCompilation) {
      command += `${config.compileCommand(codeFile)} && `;
    }
    
    command += `${config.runCommand} < /tmp/input.txt`;
    
    return command;
  }

  async collectOutput(stream) {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';

      stream.on('data', (chunk) => {
        const header = chunk.slice(0, 8);
        const type = header.readUInt8(0);
        const payload = chunk.slice(8).toString();

        if (type === 1) {
          stdout += payload;
        } else if (type === 2) {
          stderr += payload;
        }
      });

      stream.on('end', () => {
        resolve({ stdout, stderr });
      });
    });
  }

  // Alternative method using Judge0 API if Docker is not available
  async executeWithJudge0(code, language, input) {
    const axios = require('axios');
    
    const languageIds = {
      c: 50,
      cpp: 54
    };

    try {
      const response = await axios.post(
        `${process.env.JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
        {
          source_code: code,
          language_id: languageIds[language],
          stdin: input,
          cpu_time_limit: 2,
          memory_limit: 128000
        },
        {
          headers: {
            'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
            'X-RapidAPI-Host': process.env.JUDGE0_API_HOST,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data;
      
      return {
        success: result.status.id === 3, // Accepted
        output: result.stdout || '',
        error: result.stderr || result.compile_output || '',
        exitCode: result.exit_code || 0,
        runtime: result.time ? Math.round(result.time * 1000) : 0,
        memory: result.memory || 0
      };
    } catch (error) {
      throw new Error('Code execution failed: ' + error.message);
    }
  }
}

module.exports = new CodeExecutor();