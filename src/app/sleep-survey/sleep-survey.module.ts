import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SleepSurveyPageRoutingModule } from './sleep-survey-routing.module';

import { SleepSurveyPage } from './sleep-survey.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SleepSurveyPageRoutingModule
  ],
  declarations: [SleepSurveyPage]
})
export class SleepSurveyPageModule {}
