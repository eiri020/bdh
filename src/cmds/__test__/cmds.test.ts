import { BdhStatus } from '../../types';
import { createProgram } from '../cmds';
import * as dumper from '../dumper';

function fail(reason = "fail was called in a test.") {
  throw new Error(reason);
}

describe('Command tests', () => {
  
  afterEach(() => {
    jest.restoreAllMocks();
  })

  it('return an exit code 1 when there were errors running gherkin', async () => {
    const mockDumper = jest.spyOn(dumper,'dumper').mockImplementation(() => {
      const status = new BdhStatus()
      status.addFile();
      status.addError();
      status.addFileError();
      return status;
    })

    const program = createProgram();
    program.exitOverride();
   
    try {
      program.parse(['/a/executable/path', 'bdh.ts', 'gherkin', 'invalid.feature']);
      fail(`Should not reach here`);
    } catch(err) {
      expect(err.message).toBe('1 errors occured');
      expect(err.exitCode).toBe(1)
      expect(mockDumper).toBeCalled();
    }

  });

  it('return an exit code 0 when there were no errors running gherkin', async () => {
    const mockDumper = jest.spyOn(dumper,'dumper').mockImplementation(() => {
      const status = new BdhStatus()
      status.addFile();
      return status;
    })

    const program = createProgram();
    program.exitOverride();
   
    try {
      program.parse(['/a/executable/path', 'bdh.ts', 'gherkin', 'invalid.feature']);

    } catch(err) {
      fail(`Should not reach here`);
    }
    expect(mockDumper).toBeCalled();
   
  });

  it('return an exit code 1 when there were errors running yaml', async () => {
    const mockDumper = jest.spyOn(dumper,'dumper').mockImplementation(() => {
      const status = new BdhStatus()
      status.addFile();
      status.addError();
      status.addFileError();
      return status;
    })

    const program = createProgram();
    program.exitOverride();
   
    try {
      program.parse(['/a/executable/path', 'bdh.ts', 'yaml', 'invalid.yaml']);
      fail(`Should not reach here`);
    } catch(err) {
      expect(err.message).toBe('1 errors occured');
      expect(err.exitCode).toBe(1)
      expect(mockDumper).toBeCalled();
    }

  });

  it('return an exit code 0 when there were no errors running yaml', async () => {
    const mockDumper = jest.spyOn(dumper,'dumper').mockImplementation(() => {
      const status = new BdhStatus()
      status.addFile();
      return status;
    })

    const program = createProgram();
    program.exitOverride();
   
    try {
      program.parse(['/a/executable/path', 'bdh.ts', 'yaml', 'valid.yaml']);

    } catch(err) {
      fail(`Should not reach here`);
    }
    expect(mockDumper).toBeCalled();
   
  });

});