import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelRequestComponent } from './travel-request.component';

describe('TravelRequestComponent', () => {
  let component: TravelRequestComponent;
  let fixture: ComponentFixture<TravelRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
