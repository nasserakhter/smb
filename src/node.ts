import verifyBinaryDependencies, {
  type Dependency,
} from './verifyBinaryDependencies';
import { type ChildProcessWithoutNullStreams, spawn } from 'child_process';

const dependencies: Dependency[] = [
  {
    bin: 'smbclient',
    installInstructions: {
      darwin: "run 'brew install samba' to install.",
      linux: "run 'sudo apt install smbclient' to install.",
      win32: 'visit https://www.samba.org/samba/download/ to install.',
    },
  },
  {
    bin: 'stdbuf',
    installInstructions: {
      darwin: "run 'brew install coreutils' to install.",
      linux: "run 'sudo apt install coreutils' to install.",
      win32: 'visit https://www.gnu.org/software/coreutils/ to install.',
    },
  },
];

export default class SambaClient {
  #process: ChildProcessWithoutNullStreams | undefined;

  async init() {
    verifyBinaryDependencies(dependencies);

    this.#process = spawn(
      'stdbuf',
      [
        '-i0',
        '-o0',
        '-e0',
        'smbclient',
        '-U',
        'nasser',
        '--password',
        '9926',
        '//mediaserver/wdblack',
      ],
      {
        shell: false,
      }
    );

    // Add default 'catch-all' listener to prevent old lines from buffering
    const SUCCESS_LOGIN = 'Try "help" to get a list of possible commands.';
    const FAILURE_LOGIN = 'NT_STATUS_LOGON_FAILURE';
    const SERVER_NOT_FOUND = 'NT_STATUS_NOT_FOUND';
    const SHARE_NOT_FOUND = 'NT_STATUS_BAD_NETWORK_NAME';

    return new Promise<void>((resolve, reject) => {
      this.#process?.stdout.on('data', (d: Buffer) => {
        const data = d.toString();
        if (data.includes(SUCCESS_LOGIN)) resolve();
        if (data.includes(FAILURE_LOGIN))
          reject(new Error('Incorrect credentials'));
        if (data.includes(SERVER_NOT_FOUND))
          reject(new Error('Unable to find server'));
        if (data.includes(SHARE_NOT_FOUND))
          reject(new Error('The share does not exist'));
      });
    });
  }

  /**
   * Change directory, allows you to navigate the filesystem.
   * @returns {string|undefined} - the current directory
   */
  async cd(): Promise<string>;
  async cd(newDirectory: string): Promise<undefined>;
  async cd(newDirectory?: string) {
    const currentDirectoryStatement = 'Current directory is ';
    if (newDirectory) {
      this.#exec(`cd ${newDirectory}`);
      return undefined;
    }

    const data = await this.#execAndExpectOneLine('cd');
    const directory = data
      .toString()
      .trim()
      .substring(currentDirectoryStatement.length);
    return directory;
  }

  /**
   * Print working directory, allows you to see the current directory,
   * including the server and share.
   */
  async pwd() {
    const currentDirectoryStatement = 'Current directory is ';
    const data = await this.#execAndExpectOneLine('pwd');
    const directory = data
      .toString()
      .trim()
      .substring(currentDirectoryStatement.length);
    return directory;
  }

  /**
   * List all files in the current directory.
   */
  async ls() {
    const data = await this.#execUntil('ls', (data: Buffer) =>
      data.toString().includes('blocks of size')
    );

    const lsRegex = /\s*(.+?)\s{6,}(.*?)\s+([0-9]+)\s{2}(.+)/g;
    const files = data
      .toString()
      .split('\n')
      .map((x) => {
        lsRegex.lastIndex = 0;
        return lsRegex.exec(x);
      })
      .map(
        (x) =>
          x && {
            name: x[1],
            attributes: x[2],
            size: parseInt(x[3] ?? '0', 10),
            date: new Date(`${x[4] ?? 0}Z`),
          }
      )
      .filter((x) => x);
    return files;
  }

  #exec(command: string) {
    this.#process?.stdin.write(`${command}\n`);
  }

  async #execAndExpectOneLine(command: string) {
    return new Promise<Buffer>((resolve) => {
      this.#process?.stdout.once('data', (data: Buffer) => {
        resolve(data);
      });
      this.#exec(command);
    });
  }

  async #execUntil(command: string, predicate: (data: Buffer) => boolean) {
    return new Promise<Buffer>((resolve) => {
      let buffer = Buffer.alloc(0);

      const listener = (data: Buffer) => {
        // Build up buffer
        buffer = Buffer.concat([buffer, data]);
        if (predicate(data)) {
          // Remove listener once we've found what we're looking for
          this.#process?.stdout.off('data', listener);
          resolve(buffer);
        }
      };

      this.#process?.stdout.on('data', listener);
      this.#exec(command);
    });
  }
}
