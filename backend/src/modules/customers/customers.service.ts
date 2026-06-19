import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CustomerDto, AddressDto } from './dto/customer.dto';

// In-memory mock replacing DB interaction
let customersDb: any[] = [];
let auditLogsDb: any[] = [];

@Injectable()
export class CustomersService {
  
  async findAll(tenantId: string, page: number = 1, limit: number = 10, search?: string) {
    let filtered = customersDb.filter(c => c.tenantId === tenantId && c.is_active !== false);
    
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(lowerSearch) || 
        c.phone.includes(search)
      );
    }

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const data = filtered.slice(offset, offset + limit);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async findById(id: string, tenantId: string) {
    const customer = customersDb.find(c => c.id === id && c.tenantId === tenantId && c.is_active !== false);
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return customer;
  }

  async create(tenantId: string, userId: string, dto: CustomerDto) {
    if (dto.email) {
      const exists = customersDb.find(c => c.email === dto.email && c.tenantId === tenantId);
      if (exists) {
        throw new ConflictException('E-mail já cadastrado neste tenant');
      }
    }

    const newCustomer = {
      id: Math.random().toString(36).substring(7),
      tenantId,
      ...dto,
      addresses: dto.addresses.map(a => ({ ...a, id: a.id || Math.random().toString(36).substring(7) })),
      total_orders: 0,
      total_spent: 0,
      average_rating: 0,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    customersDb.push(newCustomer);

    // Audit log
    auditLogsDb.push({ tenantId, userId, action: 'CREATE_CUSTOMER', entityId: newCustomer.id, createdAt: new Date() });

    return newCustomer;
  }

  async update(id: string, tenantId: string, userId: string, dto: Partial<CustomerDto>) {
    const index = customersDb.findIndex(c => c.id === id && c.tenantId === tenantId && c.is_active !== false);
    if (index === -1) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Email dupe check
    if (dto.email && dto.email !== customersDb[index].email) {
      const exists = customersDb.find(c => c.email === dto.email && c.tenantId === tenantId);
      if (exists) {
        throw new ConflictException('E-mail já cadastrado neste tenant');
      }
    }

    const oldValues = { ...customersDb[index] };
    customersDb[index] = {
      ...customersDb[index],
      ...dto,
      updated_at: new Date()
    };

    // Audit log
    auditLogsDb.push({ tenantId, userId, action: 'UPDATE_CUSTOMER', entityId: id, oldValues, newValues: dto, createdAt: new Date() });

    return customersDb[index];
  }

  async delete(id: string, tenantId: string, userId: string) {
    const index = customersDb.findIndex(c => c.id === id && c.tenantId === tenantId && c.is_active !== false);
    if (index === -1) {
      throw new NotFoundException('Cliente não encontrado');
    }

    customersDb[index].is_active = false;
    customersDb[index].updated_at = new Date();

    // Audit log
    auditLogsDb.push({ tenantId, userId, action: 'DELETE_CUSTOMER', entityId: id, createdAt: new Date() });

    return { success: true };
  }

  async addAddress(customerId: string, tenantId: string, address: AddressDto) {
    const customer = await this.findById(customerId, tenantId);
    if (customer.addresses.length >= 5) {
      throw new ConflictException('Máximo de 5 endereços permitidos');
    }
    
    const newAddress = { ...address, id: Math.random().toString(36).substring(7) };
    customer.addresses.push(newAddress);
    return newAddress;
  }

  async removeAddress(customerId: string, addressId: string, tenantId: string) {
    const customer = await this.findById(customerId, tenantId);
    customer.addresses = customer.addresses.filter((a: any) => a.id !== addressId);
    return { success: true };
  }
}
