import fs from 'fs';
import log = require('npmlog');

import { loadYaml } from '../yaml';
import * as data from '../../__test__/samples';

function fail(reason = "fail was called in a test.") {
  throw new Error(reason);
}

describe('Yaml loader tests', () => {
  
  let mockRead;

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

  it('should fail if the file is not found', async () => {

    mockRead = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('my unique error')
    }); 

    try {
      loadYaml('some invalid file');
      fail('should not reach here');

    } catch(err) {
      expect(err).toBeDefined();
      expect(err.message).toContain('my unique error');
      expect(mockRead).toBeCalled();
    }
  });

  it('should fail if the yaml contains errors', async () => {

    mockRead = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      return data.invalidYaml;
    });


    try {
      loadYaml('some invalid file');
      fail('should not reach here');

    } catch(err) {
      expect(err).toBeDefined();
      expect(err.message).toContain('Error parsing yaml file');
    }

  });

  it('should return a yaml object if it can parse', async () => {

    mockRead = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      return data.validYaml;
    });

    let yaml;
    try {
      yaml = loadYaml('some invalid file')
    } catch(err) {
      fail('should not reach here')
    }

    expect(yaml).toHaveProperty('should_load.this');
  });


});