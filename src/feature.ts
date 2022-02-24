import Gherkin = require('@cucumber/gherkin');
import Messages = require('@cucumber/messages');
import * as fs from 'fs'
import log = require('npmlog');
import path = require('path');

export class Feature {

  private _featureFile: string;
  private _logPrefix: string;
  private _gherkin: any;

  public get featureFile() {
    return this._featureFile;
  }

  public get gherkin() {
    return this._gherkin;
  }

  constructor(featureFile: string)  {

    this._featureFile = path.resolve(featureFile);

    const parsed = path.parse(this._featureFile);
    this._logPrefix = parsed.name;    

    const uuidFn = Messages.IdGenerator.uuid()
    const builder = new Gherkin.AstBuilder(uuidFn)
    const matcher = parsed.ext.toLowerCase() === '.md' ? new Gherkin.GherkinInMarkdownTokenMatcher() : new Gherkin.GherkinClassicTokenMatcher();
    const parser = new Gherkin.Parser(builder, matcher);
    log.info(this._logPrefix,`reading feature file ${this._featureFile}`);
    
    let featureText: string;
    try {
      featureText = fs.readFileSync(this._featureFile,'utf8');
    } catch(err) {
      throw new Error(`Cannot read feature file ${this._featureFile}: ${err.message}`)
    }

    try {
      this._gherkin = parser.parse(featureText);
    
    } catch(err) {
      // TODO add line info if possible
      throw new Error(`Cannot parse feature file ${this._featureFile}: ${err.message}`)
    }

    if(!Array.isArray(this._gherkin?.feature?.children) || this._gherkin?.feature?.children.find(element => element.scenario != null) == null) {
      throw new Error(`Cannot find feature or scenarios in file ${this._featureFile}`)
    }
  }
}