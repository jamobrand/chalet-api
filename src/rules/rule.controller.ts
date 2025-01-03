import httpStatus from 'http-status';
import { asyncHandler } from '../common/utils/asyncHandler';
import { Request, Response } from 'express';
import { z } from 'zod';
import { RuleService } from './rules.service';

export class RuleController {
  private ruleService: RuleService;

  constructor(ruleService: RuleService) {
    this.ruleService = ruleService;
  }

  public createRule = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const { rule } = await this.ruleService.createRule(req.body);

    return res.status(httpStatus.CREATED).json({
      message: 'Rule added successfully',
      data: rule,
    });
  });

  public getRules = asyncHandler(async (_req: Request, res: Response): Promise<Response> => {
    const dataRules = await this.ruleService.getRules();

    return res.status(httpStatus.OK).json({
      message: 'Retrieved rules successfully',
      rules: dataRules.rules,
    });
  });

  public getRule = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const ruleId = z.string().parse(req.params['id']);
    const dataRule = await this.ruleService.getRule(ruleId);

    return res.status(httpStatus.OK).json({
      message: 'Retrieved rule successfully',
      rule: dataRule.rule,
    });
  });
}
