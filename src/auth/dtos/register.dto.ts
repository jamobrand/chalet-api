import { RoleEnum } from '../../common/enum/role.enum';

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role: RoleEnum;
}
