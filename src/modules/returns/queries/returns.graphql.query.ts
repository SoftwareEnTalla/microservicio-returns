/*
 * Copyright (c) 2026 SoftwarEnTalla
 * Licencia: MIT
 * Contacto: softwarentalla@gmail.com
 * CEOs: 
 *       Persy Morell Guerra      Email: pmorellpersi@gmail.com  Phone : +53-5336-4654 Linkedin: https://www.linkedin.com/in/persy-morell-guerra-288943357/
 *       Dailyn García Domínguez  Email: dailyngd@gmail.com      Phone : +53-5432-0312 Linkedin: https://www.linkedin.com/in/dailyn-dominguez-3150799b/
 *
 * CTO: Persy Morell Guerra
 * COO: Dailyn García Domínguez and Persy Morell Guerra
 * CFO: Dailyn García Domínguez and Persy Morell Guerra
 *
 * Repositories: 
 *               https://github.com/SoftwareEnTalla 
 *
 *               https://github.com/apokaliptolesamale?tab=repositories
 *
 *
 * Social Networks:
 *
 *              https://x.com/SoftwarEnTalla
 *
 *              https://www.facebook.com/profile.php?id=61572625716568
 *
 *              https://www.instagram.com/softwarentalla/
 *              
 *
 *
 */

import { Query, Resolver, Args } from '@nestjs/graphql'; 
import { ReturnsDto } from '../dtos/all-dto';
import { ReturnsGraphqlService } from '../services/returns.graphql.service';
import { NotFoundException } from '@nestjs/common';

@Resolver(() => ReturnsDto)
export class ReturnsGraphqlQuery {
  constructor(private readonly service: ReturnsGraphqlService) {}

  @Query(() => [ReturnsDto], { name: 'findAllReturnss' })
  async findAll(): Promise<ReturnsDto[]> {
    return this.service.findAll();
  }

  @Query(() => ReturnsDto, { name: 'findReturnsById' })
  async findById(
    @Args('id', { type: () => String }) id: string
  ): Promise<ReturnsDto> {
    const result = await this.service.findById(id);
    if (!result) {
      throw new NotFoundException("Returns con id " + id + " no encontrado");
    }
    return result;
  }
}
