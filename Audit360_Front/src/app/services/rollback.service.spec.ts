import { TestBed } from '@angular/core/testing';

import { RollbackService } from './rollback.service';

describe('RollbackService', () => {
  let service: RollbackService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RollbackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
