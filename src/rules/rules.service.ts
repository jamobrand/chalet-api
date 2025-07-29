import { logger } from '../common/utils/logger';
import { BadRequestException, InternalServerException } from '../common/utils/catch-errors';
import prismaClient from '../config/prisma';
import { ErrorCode } from '../common/enum/error-code.enum';
import { CreateRuleDto } from './dtos/create-rule.dto';

export class RuleService {
  public async createRule(createRuleDto: CreateRuleDto) {
    const { title, icon, description } = createRuleDto;

    const newRule = await prismaClient.chaletRules.create({
      data: {
        title,
        description,
        icon,
      },
    });

    if (!newRule) {
      logger.warn(`Rule creation failed: ${name}`);
      throw new InternalServerException('Rule creation Failed', ErrorCode.INTERNAL_SERVER_ERROR);
    }

    return {
      rule: newRule,
    };
  }

  public async getRules() {
    const rules = await prismaClient.chaletRules.findMany({});

    return {
      rules: rules,
    };
  }

  public async getRule(ruleId: string) {
    const rule = await prismaClient.chaletRules.findUnique({
      where: {
        id: ruleId,
      },
    });

    if (!rule) {
      throw new BadRequestException('Rule not found');
    }
    return {
      rule: rule,
    };
  }
}
