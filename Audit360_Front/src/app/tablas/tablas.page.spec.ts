import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablasPage } from './tablas.page';

describe('TablasPage', () => {
  let component: TablasPage;
  let fixture: ComponentFixture<TablasPage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(TablasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
