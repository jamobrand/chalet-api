import { Router } from 'express';
import { ruleController } from './rule.module';

const ruleRoutes = Router();

ruleRoutes.get('/all-rules', ruleController.getRules);
ruleRoutes.get('/:id', ruleController.getRule);
ruleRoutes.post('/create-rule', ruleController.createRule);

export default ruleRoutes;
