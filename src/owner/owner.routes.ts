import { Router } from 'express';
import { isAuth } from '../common/lib/isAuth';
import { ownerController } from './owner.module';

const ownerRoutes = Router();

ownerRoutes.post('/create-owner', ownerController.createOwner);
ownerRoutes.get('/owners', isAuth, ownerController.getOwners);


export default ownerRoutes;
