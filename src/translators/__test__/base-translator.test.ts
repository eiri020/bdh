import { BaseTranslator } from "../base-translator";
import { parseGherkin } from '../../loaders/gherkin';
import * as data from '../../__test__/samples';


describe('Gherkin Translator tests', () => {

  beforeAll(async () => {
    jest.restoreAllMocks();
  })

  it('should have errors if feature cannot be found', () => {

    const translater = new BaseTranslator('no-feature',{});
    let result;

    try {

      result = translater.translate();
    } catch(err) {
      fail('should not reach here');
    }
    expect(result.numFiles).toBe(1);
    expect(result.numScenarios).toBe(0);
    expect(result.numMissing).toBe(0);
    expect(result.numDeleted).toBe(0);
    expect(result.numErrors).toBe(1);
    expect(result.numFileErrors).toBe(1);
  });

  it('should have errors on an empty feature', async () => {
    // const gherkin = parseGherkin(data.emptyFeature);

    const translater = new BaseTranslator('empty-feature',
        {
          feature: { 
              children: 'abc'
          }
        });

    let result;

    try {

      result = translater.translate();
    } catch(err) {
      fail('should not reach here');
    }
    expect(result.numFiles).toBe(1);
    expect(result.numScenarios).toBe(0);
    expect(result.numMissing).toBe(0);
    expect(result.numDeleted).toBe(0);
    expect(result.numErrors).toBe(1);
    expect(result.numFileErrors).toBe(1);
  });
  it('should have errors on an empty scenarios', async () => {
    const gherkin = parseGherkin(data.emptyScenario);

    const translater = new BaseTranslator('empty-scenario',gherkin);

    let result;

    try {

      result = translater.translate();
    } catch(err) {
      fail('should not reach here');
    }
    expect(result.numFiles).toBe(1);
    expect(result.numScenarios).toBe(2);
    expect(result.numMissing).toBe(0);
    expect(result.numDeleted).toBe(0);
    expect(result.numErrors).toBe(1);
    expect(result.numFileErrors).toBe(1);
  });

  it('should succeed if there is no given section', async () => {
    const gherkin = parseGherkin(data.nogivenScenario);

    const translater = new BaseTranslator('nowhen-scenario',gherkin);

    let result;

    try {
      result = translater.translate();
    } catch(err) {
      fail('should not reach here');
    }
    expect(result.numFiles).toBe(1);
    expect(result.numScenarios).toBe(2);
    expect(result.numMissing).toBe(0);
    expect(result.numDeleted).toBe(0);
    expect(result.numErrors).toBe(0);
    expect(result.numFileErrors).toBe(0);

  });
  
  it('should have errors if there is no when section', async () => {
    const gherkin = parseGherkin(data.nowhenScenario);

    const translater = new BaseTranslator('nowhen-scenario',gherkin);

    let result;

    try {

      result = translater.translate();
    } catch(err) {
      fail('should not reach here');
    }
    expect(result.numFiles).toBe(1);
    expect(result.numScenarios).toBe(2);
    expect(result.numMissing).toBe(0);
    expect(result.numDeleted).toBe(0);
    expect(result.numErrors).toBe(1);
    expect(result.numFileErrors).toBe(1);

  });

  it('should have errors if there is no then section', async () => {
    const gherkin = parseGherkin(data.nothenScenario);

    const translater = new BaseTranslator('nowhen-scenario',gherkin);

    let result;

    try {

      result = translater.translate();
    } catch(err) {
      fail('should not reach here');
    }
    expect(result.numFiles).toBe(1);
    expect(result.numScenarios).toBe(2);
    expect(result.numMissing).toBe(0);
    expect(result.numDeleted).toBe(0);
    expect(result.numErrors).toBe(1);
    expect(result.numFileErrors).toBe(1);
  });

  it.todo('should have errors if the scenario outline does not have examples');
  it.todo('should have errors if the scenario outline cannot be found');
  it('should succeed on an valid feature file', async () => {
    const gherkin = parseGherkin(data.validFeature);

    const translater = new BaseTranslator('nowhen-scenario',gherkin);

    let result;

    try {

      result = translater.translate();
    } catch(err) {
      fail('should not reach here');
    }
    expect(result.numFiles).toBe(1);
    expect(result.numScenarios).toBe(2);
    expect(result.numMissing).toBe(0);
    expect(result.numDeleted).toBe(0);
    expect(result.numErrors).toBe(0);
    expect(result.numFileErrors).toBe(0);

    expect(translater.lines.length).toBeGreaterThan(1);
    expect(translater.source.split("\n").length > 0);
    expect(translater.yaml).toBeInstanceOf(Array);
  });

  it('should fail if a requested scenario cannot be found', async () => {

    const gherkin = parseGherkin(data.validFeature);

    const translater = new BaseTranslator('nowhen-scenario',gherkin);

    let result;

    try {

      result = translater.translate('not existing');
    } catch(err) {
      fail('should not reach here');
    }
    expect(result.numFiles).toBe(1);
    expect(result.numScenarios).toBe(0);
    expect(result.numMissing).toBe(0);
    expect(result.numDeleted).toBe(0);
    expect(result.numErrors).toBe(1);
    expect(result.numFileErrors).toBe(1);

    expect(translater.lines.length).toBe(0);
  });
  it('should translate only a single scenario if requested', async () => {
    const gherkin = parseGherkin(data.validFeature);

    const translater = new BaseTranslator('nowhen-scenario',gherkin);

    let result;

    try {

      result = translater.translate('Leaving home');
    } catch(err) {
      fail('should not reach here');
    }
    expect(result.numFiles).toBe(1);
    expect(result.numScenarios).toBe(1);
    expect(result.numMissing).toBe(0);
    expect(result.numDeleted).toBe(0);
    expect(result.numErrors).toBe(0);
    expect(result.numFileErrors).toBe(0);

    expect(translater.lines.length).toBeGreaterThan(0);

  });

});