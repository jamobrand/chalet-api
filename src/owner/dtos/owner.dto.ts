import { RoleEnum } from '../../common/enum/role.enum';

export interface OwnerDto {
  name: string;
  email: string;
  password: string;
  role: RoleEnum;
}
