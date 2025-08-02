import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-sleep-survey',
  templateUrl: './sleep-survey.page.html',
  styleUrls: ['./sleep-survey.page.scss'],
  standalone:false
})
export class SleepSurveyPage {

  // API Configuration
  private readonly API_URL = 'http://localhost:5000/predict'; // Change to your Flask server URL

  // Survey data object
  surveyData = {
    // Behavioral Factors
    sleep_hours: '',
    interest_rate: null,
    position: '',
    screen_time: '',
    acad_pressure: '',

    // Sleep Quality Scale
    difficulty_falling_asleep: null,
    waking_up: null,
    diff_back_to_sleep: null,
    toss_turn: null,
    unrefreshed: null,
    head_aches: null,
    irritated: null,
    intervenes: null,
    getting_out_of_bed: null,
    concentration: null,

    // Contextual Variables
    temp: null,
    ventilation: null,
    noise_level: null,
    lighting: null,
    experiences: [] as string[]
  };

  constructor(
    private http: HttpClient,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  // Handle rating changes for star ratings
  onRatingChange(field: string, value: number) {
    (this.surveyData as any)[field] = value;
  }

  // Get rating value for star display
  getRatingValue(field: string): number {
    return (this.surveyData as any)[field];
  }

  // Handle experience checkbox changes
  onExperienceChange(experience: string, isChecked: boolean) {
    if (isChecked) {
      if (experience === 'None') {
        // If "None" is selected, clear all other experiences
        this.surveyData.experiences = ['None'];
      } else {
        // Remove "None" if it exists and add the new experience
        this.surveyData.experiences = this.surveyData.experiences.filter(exp => exp !== 'None');
        if (!this.surveyData.experiences.includes(experience)) {
          this.surveyData.experiences.push(experience);
        }
      }
    } else {
      // Remove the experience from the array
      this.surveyData.experiences = this.surveyData.experiences.filter(exp => exp !== experience);
    }
  }

  // Check if experience is selected
  isExperienceSelected(experience: string): boolean {
    return this.surveyData.experiences.includes(experience);
  }

  // Form validation
  isFormValid(): boolean {
    const requiredFields = [
      'sleep_hours', 'interest_rate', 'position', 'screen_time', 'acad_pressure',
      'difficulty_falling_asleep', 'waking_up', 'diff_back_to_sleep', 'toss_turn',
      'unrefreshed', 'head_aches', 'irritated', 'intervenes', 'getting_out_of_bed',
      'concentration', 'temp', 'ventilation', 'noise_level', 'lighting'
    ];

    const isValid = requiredFields.every(field => {
      const value = (this.surveyData as any)[field];
      return value !== null && value !== undefined && value !== '';
    });

    // Also check that at least one experience is selected or "None" is selected
    const hasExperience = this.surveyData.experiences.length > 0;

    return isValid && hasExperience;
  }

  // Convert experiences array to individual boolean columns
  private prepareDataForAPI() {
    const apiData = { ...this.surveyData };

    // Remove the experiences array
    delete (apiData as any).experiences;

    // Add individual boolean fields for each experience
    (apiData as any).sleep_disorder = this.surveyData.experiences.includes('Sleep disorder(e.g., insomnia, sleep apnea)');
    (apiData as any).health_condition = this.surveyData.experiences.includes('Health condition affecting sleep');
    (apiData as any).part_time_job = this.surveyData.experiences.includes('Part-time job affecting schedule');
    (apiData as any).lifestyle_habits = this.surveyData.experiences.includes('Lifestyle habits (e.g., staying up late, caffeine)');
    (apiData as any).none_experience = this.surveyData.experiences.includes('None');

    return apiData;
  }

  // Submit the survey
  async onSubmit() {
    if (!this.isFormValid()) {
      await this.showToast('Please fill in all required fields', 'warning');
      return;
    }

    // First test if the server is reachable
    const isServerReachable = await this.testServerConnection();
    if (!isServerReachable) {
      await this.showToast('Cannot connect to server. Please check if Flask app is running on http://localhost:5000', 'danger');
      return;
    }

    // Show loading spinner
    const loading = await this.loadingController.create({
      message: 'Analyzing your sleep data...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Prepare headers
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      // Prepare data for API (convert experiences to boolean columns)
      const apiData = this.prepareDataForAPI();

      console.log('Sending survey data:', apiData); // Debug log

      // Make API call
      const response = await this.http.post<{prediction: string}>(
        this.API_URL,
        apiData,
        { headers }
      ).toPromise();

      // Hide loading spinner
      await loading.dismiss();

      console.log('API Response:', response); // Debug log

      // Show prediction result
      if (response && response.prediction) {
        await this.showPredictionResult(response.prediction);
      } else {
        await this.showToast('Unexpected response format', 'danger');
      }

    } catch (error: any) {
      // Hide loading spinner
      await loading.dismiss();

      // Handle different types of errors
      let errorMessage = 'Failed to get prediction. Please try again.';

      if (error.status === 0) {
        errorMessage = 'Cannot connect to server. Please ensure Flask app is running and CORS is enabled.';
      } else if (error.status === 400) {
        errorMessage = 'Invalid survey data. Please check your inputs.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.error && error.error.error) {
        errorMessage = error.error.error;
      }

      await this.showToast(errorMessage, 'danger');
      console.error('API Error Details:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        url: error.url,
        error: error.error
      });
    }
  }

  // Test server connection
  private async testServerConnection(): Promise<boolean> {
    try {
      const testUrl = 'http://localhost:5000/health';
      await this.http.get(testUrl).toPromise();
      return true;
    } catch (error) {
      console.error('Server connection test failed:', error);
      return false;
    }
  }

  // Show prediction result in an alert
  private async showPredictionResult(prediction: string) {
    const alert = await this.alertController.create({
      header: 'Sleep Analysis Result',
      message: `
        <div style="text-align: center; padding: 10px;">
          <ion-icon name="analytics-outline" style="font-size: 48px; color: var(--ion-color-primary);"></ion-icon>
          <h3 style="margin: 15px 0;">Your Sleep Status:</h3>
          <p style="font-size: 18px; font-weight: bold; color: var(--ion-color-primary);">
            ${prediction}
          </p>
        </div>
      `,
      buttons: [
        {
          text: 'Take Another Survey',
          handler: () => {
            this.resetForm();
          }
        },
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  // Show toast messages
  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  // Reset form for new survey
  private resetForm() {
    this.surveyData = {
      sleep_hours: '',
      interest_rate: null,
      position: '',
      screen_time: '',
      acad_pressure: '',
      difficulty_falling_asleep: null,
      waking_up: null,
      diff_back_to_sleep: null,
      toss_turn: null,
      unrefreshed: null,
      head_aches: null,
      irritated: null,
      intervenes: null,
      getting_out_of_bed: null,
      concentration: null,
      temp: null,
      ventilation: null,
      noise_level: null,
      lighting: null,
      experiences: []
    };
  }
}
