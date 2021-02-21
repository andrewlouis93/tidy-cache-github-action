import * as core from "@actions/core";
import * as os from 'os'
import * as exec from "@actions/exec";
import * as fs from 'fs'
import * as util from 'util'
import * as stream from 'stream'

import {SocketTimeout} from './constants'

import {HttpClient} from '@actions/http-client'
import {IHttpClientResponse} from '@actions/http-client/interfaces'

import {retryHttpClientResponse} from './requestUtils'

export function isExactKeyMatch(key: string, cacheKey?: string): boolean {
    return !!(
        cacheKey &&
        cacheKey.localeCompare(key, undefined, {
            sensitivity: "accent"
        }) === 0
    );
}

export function toAbsolutePath(path : string) : string {
    if (path[0] === '~') {
      path = os.homedir() + path.slice(1);
    }
    return path
}

export function logWarning(message: string): void {
    const warningPrefix = "[warning]";
    core.info(`${warningPrefix}${message}`);
}

export function getInputAsArray(
    name: string,
    options?: core.InputOptions
): string[] {
    return core
        .getInput(name, options)
        .split("\n")
        .map(s => s.trim())
        .filter(x => x !== "");
}

export function getInputAsInt(
    name: string,
    options?: core.InputOptions
): number | undefined {
    const value = parseInt(core.getInput(name, options));
    if (isNaN(value) || value < 0) {
        return undefined;
    }
    return value;
}

export class CommandOutput {
  standardOut : string;
  errorOut : string;

  constructor(standardOut : string, errorOut : string) {
    this.standardOut = standardOut;
    this.errorOut = errorOut;
  }

  getStandardOut() {
    return this.standardOut;
  }

  getErrorOut() {
    return this.errorOut;
  }

  standardOutAsString() {
    return this.standardOut.trim()
  }

  standardOutAsStringArray() {
    return this.standardOut.split("\n")
    .map(s => s.trim())
    .filter(x => x !== "");
  }

}

export async function runCommand(executable : string, parameters : Array<string>) : Promise<CommandOutput> {
  let standardOut = '';
  let errorOut = '';

  await exec.exec(executable, parameters, {
      silent: false,
      failOnStdErr: false,
      ignoreReturnCode: false,
      listeners: {
          stdout: (data: Buffer) => {
              standardOut += data.toString();
          },
          stderr: (data: Buffer) => {
              errorOut += data.toString();
          }
      }
  });

  return new CommandOutput(standardOut, errorOut);
}

export async function runJavaCommand(parameters : Array<string>) : Promise<CommandOutput> {
  return runCommand("java", parameters);
}

/**
 * Pipes the body of a HTTP response to a stream
 *
 * @param response the HTTP response
 * @param output the writable stream
 */
export async function pipeResponseToStream(
  response: IHttpClientResponse,
  output: NodeJS.WritableStream
): Promise<void> {
  const pipeline = util.promisify(stream.pipeline)
  await pipeline(response.message, output)
}

export async function downloadCacheHttpClient(
  archiveLocation: string,
  archivePath: string
): Promise<void> {
  const writeStream = fs.createWriteStream(archivePath)
  const httpClient = new HttpClient('actions/cache')
  const downloadResponse = await retryHttpClientResponse(
    'downloadCache',
    async () => httpClient.get(archiveLocation)
  )

  // Abort download if no traffic received over the socket.
  downloadResponse.message.socket.setTimeout(SocketTimeout, () => {
    downloadResponse.message.destroy()
    core.debug(`Aborting download, socket timed out after ${SocketTimeout} ms`)
  })

  await pipeResponseToStream(downloadResponse, writeStream)
}
