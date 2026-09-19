import { Vertical, IVertical } from '../models/verticalModel';

export const verticalRepo = {

  async findAll(): Promise<IVertical[]> {
    return Vertical.find({})
      .sort({ name: 1 })
      .exec();
  },

  async findById(id: string): Promise<IVertical | null> {
    return Vertical.findById(id).exec();
  },

  async findByName(name: string): Promise<IVertical | null> {
    return Vertical.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } }).exec();
  },

  async create(data: Partial<IVertical>): Promise<IVertical> {
    const vertical = new Vertical(data);
    return vertical.save();
  },

  async update(id: string, data: Partial<IVertical>): Promise<IVertical | null> {
    return Vertical.findByIdAndUpdate(id, data, { new: true }).exec();
  },

  async delete(id: string): Promise<IVertical | null> {
    return Vertical.findByIdAndDelete(id).exec();
  },

  async count(): Promise<number> {
    return Vertical.countDocuments({}).exec();
  }
};
