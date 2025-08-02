import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SleepSurveyPage } from './sleep-survey.page';

const routes: Routes = [
  {
    path: '',
    component: SleepSurveyPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SleepSurveyPageRoutingModule {}
