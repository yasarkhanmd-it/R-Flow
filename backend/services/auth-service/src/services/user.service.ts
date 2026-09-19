import { userRepo } from '../repo/userrepo';
import { IUser } from '../models/userModel';
import { buildUserResponse } from './auth.service';

export const userService = {
  async getUserById(id: string) {
    const user = await userRepo.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return buildUserResponse(user);
  },

  async updateUser(id: string, updateData: Partial<IUser>) {
    const user = await userRepo.updateUser(id, updateData);
    if (!user) {
      throw new Error('User not found');
    }
    return buildUserResponse(user);
  },

  async deleteUser(id: string) {
    const user = await userRepo.deleteUser(id);
    if (!user) {
      throw new Error('User not found');
    }
    return buildUserResponse(user);
  }
};
