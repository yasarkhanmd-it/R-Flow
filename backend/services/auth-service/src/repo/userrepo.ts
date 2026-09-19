import { User, IUser } from '../models/userModel';

export const userRepo = {
  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = User.findOne({ email });
    if (includePassword) {
      query.select('+password');
    }
    return query.exec();
  },

  async findByEmployeeId(employeeId: string): Promise<IUser | null> {
    return User.findOne({ employeeId }).exec();
  },

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id).exec();
  },

  async createUser(userData: Partial<IUser>): Promise<IUser> {
    return User.create(userData);
  },

  async updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, updateData, { new: true }).exec();
  },

  async findByEmailWithOtp(email: string): Promise<IUser | null> {
    return User.findOne({ email })
      .select('+password +resetOtp +resetOtpExpiry +otpVerified +otpAttempts')
      .exec();
  },

  async updateByEmail(email: string, updateData: Partial<IUser>): Promise<IUser | null> {
    return User.findOneAndUpdate({ email }, updateData, { new: true }).exec();
  },

  async deleteUser(id: string): Promise<IUser | null> {
    return User.findByIdAndDelete(id).exec();
  },

  async find(query: any = {}): Promise<IUser[]> {
    return User.find(query).exec();
  }
};
