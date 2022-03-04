import fs from 'fs';
import log = require('npmlog');
import { BdhStatus } from '../../types';
import { dumper } from '../dumper';


function fail(reason = "fail was called in a test.") {
  throw new Error(reason);
}

class MockDirEnt {
  private _isDir: boolean;
  private _name: string;

  constructor(name: string, isdir: boolean) {
    this._name = name;
    this._isDir = isdir;
  }

  isDirectory() {
    return this._isDir;
  }

  public get name() {
    return this._name
  }
}

const isDirEnt = new MockDirEnt('isDirEnt',true);
const isFileEnt = new MockDirEnt('isFileEnt.dumper',false);

describe('Recurse dumper tests', () => {
  
  let logErrors = [];
  let logInfos = [];


  afterEach(() => {
    // mockRead.mockRestoreAll();
    jest.restoreAllMocks();
    logErrors = [];
    logInfos = [];
  })

  log.on('log.error', logErrors.push.bind(logErrors));
  log.on('log.info', logInfos.push.bind(logInfos));

  it('should fail when loader fails', async () => {

    const failedLoader = jest.fn(() => {
      throw new Error('loader error');
    });

    const mockLStat = jest.spyOn(fs,'lstatSync').mockImplementation(() => isFileEnt as never);
    const mockReadDir = jest.spyOn(fs,'readdirSync').mockImplementation(() => [ isDirEnt as never, isFileEnt as never]);

    let status: BdhStatus; 
    try {

      status = dumper(['file1.feature', 'file2.feature'], { loglevel: 'info'}, failedLoader);

    } catch(err) {
      fail('should not reach here');
    }

    expect(status).toBeDefined();
    expect(mockLStat).toBeCalled();
    expect(mockReadDir).not.toBeCalled();
    expect(failedLoader).toBeCalledTimes(2);
    expect(status.numFiles).toBe(2);
    expect(status.numFileErrors).toBe(2)

  });

  it('should fail if file is directory and not recurse', async () => {

    const successLoader = jest.fn(() => {
      return {};
    });

    const mockLStat = jest.spyOn(fs,'lstatSync')
      .mockImplementationOnce(() => new MockDirEnt('root dir', true) as never as never)
      .mockImplementationOnce(() => new MockDirEnt('file1.feature', false) as never as never)
      .mockImplementationOnce(() => new MockDirEnt('some subdir', true) as never as never)
      .mockImplementationOnce(() => new MockDirEnt('file2.feature', false) as never as never)
      .mockImplementationOnce(() => { throw new Error('Should not reach here!') });
      
    const mockReadDir = jest.spyOn(fs,'readdirSync')
      .mockImplementationOnce(() => [ new MockDirEnt('file1.feature', false) as never, new MockDirEnt('folder', true) as never])
      .mockImplementationOnce(() => [ new MockDirEnt('..', true) as never, new MockDirEnt('file2.feature', false) as never])
      .mockImplementationOnce(() => []);

    let status: BdhStatus; 
    try {

      status = dumper(['file1.feature','..'], { loglevel: 'info'}, successLoader);

    } catch(err) {
      fail('should not reach here');
    }

    expect(status).toBeDefined();
    expect(mockLStat).toBeCalledTimes(1);
    expect(mockReadDir).not.toBeCalledTimes(1);
    expect(successLoader).not.toBeCalled();
    expect(status.numFiles).toBe(0);
    expect(status.numFileErrors).toBe(1)

  });

  it('should go recurse if extension passed', async () => {

    const successLoader = jest.fn(() => {
      return {};
    });

    const mockLStat = jest.spyOn(fs,'lstatSync')
      .mockImplementationOnce(() => new MockDirEnt('root dir', true) as never as never)
      .mockImplementationOnce(() => new MockDirEnt('file1.feature', false) as never as never)
      .mockImplementationOnce(() => new MockDirEnt('some subdir', true) as never as never)
      .mockImplementationOnce(() => new MockDirEnt('file2.feature', false) as never as never)
      .mockImplementationOnce(() => { throw new Error('Should not reach here!') })

    const mockReadDir = jest.spyOn(fs,'readdirSync')
      .mockImplementationOnce(() => [ new MockDirEnt('file1.feature', false) as never, new MockDirEnt('folder', true) as never])
      .mockImplementationOnce(() => [ new MockDirEnt('..', true) as never, new MockDirEnt('file2.feature', false) as never])
      .mockImplementationOnce(() => []);

    let status: BdhStatus; 
    try {

      status = dumper(['file1.feature'], { loglevel: 'info'}, successLoader, '.feature');

    } catch(err) {
      fail('should not reach here');
    }

    expect(status).toBeDefined();
    expect(mockLStat).toBeCalledTimes(4);
    expect(mockReadDir).toBeCalledTimes(2);
    expect(successLoader).toBeCalledTimes(2);
    expect(status.numFiles).toBe(2);
    expect(status.numFileErrors).toBe(0)

  });


  // it('should fail on folder if no extentions parameter set', async () => {

  //   const failedLoader = jest.fn(() => {
  //     throw new Error('loader error');
  //   });

  //   let status: BdhStatus; 
  //   try {

  //     status = dumper(['file1.feature', 'file2.feature'], { loglevel: 'info'}, failedLoader);

  //   } catch(err) {
  //     fail('should not reach here');
  //   }

  //   expect(status).toBeDefined();
  //   expect(failedLoader).toBeCalledTimes(2);
  //   expect(status.numFiles).toBe(2);
  //   expect(status.numFileErrors).toBe(2)

  // });

});