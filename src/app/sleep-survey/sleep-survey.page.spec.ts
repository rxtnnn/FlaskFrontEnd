import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SleepSurveyPage } from './sleep-survey.page';

describe('SleepSurveyPage', () => {
  let component: SleepSurveyPage;
  let fixture: ComponentFixture<SleepSurveyPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SleepSurveyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
