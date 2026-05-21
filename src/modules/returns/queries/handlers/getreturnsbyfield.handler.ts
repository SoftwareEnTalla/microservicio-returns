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


import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetReturnsByFieldQuery } from '../getreturnsbyfield.query';
import { ReturnsQueryService } from '../../services/returnsquery.service';

@QueryHandler(GetReturnsByFieldQuery)
export class GetReturnsByFieldHandler implements IQueryHandler<GetReturnsByFieldQuery> {
  constructor(private readonly queryService: ReturnsQueryService) {}

  async execute(query: GetReturnsByFieldQuery) {
    return this.queryService.findByField(query.filters?.field, query.filters?.value, { page: query.filters?.page ?? 1, size: query.filters?.limit ?? 10 } as any);
  }
}
