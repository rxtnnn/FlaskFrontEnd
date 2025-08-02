import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';

interface SurveyData {
  sleep_hours: string;
  interest_rate: string;
  position: string;
  screen_time: string;
  acad_pressure: string;
  temp: string;
  ventilation: string;
  noise_level: string;
  lighting: string;
  experiences: string;
  difficulty_falling_asleep: string;
  waking_up: string;
  diff_back_to_sleep: string;
  toss_turn: string;
  unrefreshed: string;
  head_aches: string;
  irritated: string;
  intervenes: string;
  getting_out_of_bed: string;
  concentration: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class Home {

  surveyData: SurveyData = {
    sleep_hours: '',
    interest_rate: '',
    position: '',
    screen_time: '',
    acad_pressure: '',
    temp: '',
    ventilation: '',
    noise_level: '',
    lighting: '',
    experiences: '',
    difficulty_falling_asleep: '',
    waking_up: '',
    diff_back_to_sleep: '',
    toss_turn: '',
    unrefreshed: '',
    head_aches: '',
    irritated: '',
    intervenes: '',
    getting_out_of_bed: '',
    concentration: ''
  };

  experiences: string[] = [];
  isSubmitting = false;

  constructor(
    private http: HttpClient,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  onRatingChange(field: keyof SurveyData, value: number) {
    const ratingMap: { [key: number]: string } = {
      1: 'Rarely',
      2: 'Sometimes',
      3: 'Often',
      4: 'Almost Always'
    };

    // Special mapping for different rating scales
    if (field === 'interest_rate') {
      const interestMap: { [key: number]: string } = {
        1: 'Not Interested',
        2: 'Neutral',
        3: 'Interested',
        4: 'Very Interested'
      };
      this.surveyData[field] = interestMap[value];
    } else if (['temp', 'ventilation', 'noise_level', 'lighting'].includes(field)) {
      const environmentMap: { [key: number]: string } = {
        1: 'Very Poor',
        2: 'Poor',
        3: 'Average',
        4: 'Good',
        5: 'Excellent'
      };
      this.surveyData[field] = environmentMap[value];
    } else {
      this.surveyData[field] = ratingMap[value];
    }
  }

  onExperienceChange(experience: string, checked: boolean) {
    if (experience === 'None') {
      if (checked) {
        this.experiences = ['None'];
        this.surveyData.experiences = 'None';
      } else {
        this.experiences = [];
        this.surveyData.experiences = '';
      }
    } else {
      if (checked) {
        // Remove 'None' if selecting other options
        const noneIndex = this.experiences.indexOf('None');
        if (noneIndex > -1) {
          this.experiences.splice(noneIndex, 1);
        }

        if (!this.experiences.includes(experience)) {
          this.experiences.push(experience);
        }
      } else {
        const index = this.experiences.indexOf(experience);
        if (index > -1) {
          this.experiences.splice(index, 1);
        }
      }

      this.surveyData.experiences = this.experiences.join(', ');
    }
  }

  isFormValid(): boolean {
    return Object.values(this.surveyData).every(value => value !== '');
  }

  getRatingValue(field: keyof SurveyData): number {
    const value = this.surveyData[field];

    if (field === 'interest_rate') {
      const map: { [key: string]: number } = {
        'Not Interested': 1,
        'Neutral': 2,
        'Interested': 3,
        'Very Interested': 4
      };
      return map[value] || 0;
    } else if (['temp', 'ventilation', 'noise_level', 'lighting'].includes(field)) {
      const map: { [key: string]: number } = {
        'Very Poor': 1,
        'Poor': 2,
        'Average': 3,
        'Good': 4,
        'Excellent': 5
      };
      return map[value] || 0;
    } else {
      const map: { [key: string]: number } = {
        'Rarely': 1,
        'Sometimes': 2,
        'Often': 3,
        'Almost Always': 4
      };
      return map[value] || 0;
    }
  }

  isExperienceSelected(experience: string): boolean {
    return this.experiences.includes(experience);
  }

  async showValidationAlert() {
    const alert = await this.alertController.create({
      header: 'Incomplete Form',
      message: 'Please complete all required fields before submitting.',
      buttons: ['OK']
    });
    await alert.present();
  }

  async showSuccessToast() {
    const toast = await this.toastController.create({
      message: 'Survey submitted successfully!',
      duration: 3000,
      position: 'top',
      color: 'success'
    });
    await toast.present();
  }

  async showErrorToast() {
    const toast = await this.toastController.create({
      message: 'Error submitting survey. Please try again.',
      duration: 3000,
      position: 'top',
      color: 'danger'
    });
    await toast.present();
  }

  async onSubmit() {
    if (!this.isFormValid()) {
      await this.showValidationAlert();
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Submitting survey...',
      spinner: 'circular'
    });
    await loading.present();

    try {
      // Replace with your actual backend endpoint
      const response = await this.http.post('/api/sleep-survey', this.surveyData).toPromise();
      console.log('Survey submitted successfully:', response);
      console.log('Survey data being sent:', this.surveyData);

      await this.showSuccessToast();
      this.resetForm();
    } catch (error) {
      console.error('Error submitting survey:', error);
      await this.showErrorToast();
    } finally {
      await loading.dismiss();
    }
  }

  resetForm() {
    this.surveyData = {
      sleep_hours: '',
      interest_rate: '',
      position: '',
      screen_time: '',
      acad_pressure: '',
      temp: '',
      ventilation: '',
      noise_level: '',
      lighting: '',
      experiences: '',
      difficulty_falling_asleep: '',
      waking_up: '',
      diff_back_to_sleep: '',
      toss_turn: '',
      unrefreshed: '',
      head_aches: '',
      irritated: '',
      intervenes: '',
      getting_out_of_bed: '',
      concentration: ''
    };
    this.experiences = [];
  }
}
