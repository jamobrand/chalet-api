import { RuleController } from './rule.controller';
import { RuleService } from './rules.service';


const ruleService = new RuleService();
const ruleController = new RuleController(ruleService);

export { ruleService, ruleController };
