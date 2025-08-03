  import { Component } from '@angular/core';
  import { HttpClient, HttpHeaders } from '@angular/common/http';
  import { AlertController, LoadingController, ToastController } from '@ionic/angular';

  @Component({
    selector: 'app-sleep-survey',
    templateUrl: './sleep-survey.page.html',
    styleUrls: ['./sleep-survey.page.scss'],
    standalone: false
  })
  export class SleepSurveyPage {
    private readonly API_URL = 'http://127.0.0.1:5000/predict';

    surveyData = {
      sleep_hours: '',
      interest_rate: null,
      position: '',
      screen_time: '',
      acad_pressure: '',
      // SQS numeric answers
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
      // Contextual numeric answers
      temp: null,
      ventilation: null,
      noise_level: null,
      lighting: null,
      // experiences as an array in the UI
      experiences: [] as string[]
    };

    constructor(
      private http: HttpClient,
      private alertCtrl: AlertController,
      private loadingCtrl: LoadingController,
      private toastCtrl: ToastController
    ) {}

    // ─── Lookup tables ──────────────────────────────────────────────────────────

    /** Interest (1–4) → label */
    private readonly interestMap: Record<number,string> = {
      1: 'Not Interested',
      2: 'Neutral',
      3: 'Interested',
      4: 'Very Interested'
    };

    /** SQS (1–4) → label */
    private readonly sqsMap: Record<number,string> = {
      1: 'Rarely',
      2: 'Sometimes',
      3: 'Often',
      4: 'Almost Always'
    };

    /** Contextual (1–5) → label */
    private readonly contextualMap: Record<number,string> = {
      1: 'Very Poor',
      2: 'Poor',
      3: 'Average',
      4: 'Good',
      5: 'Excellent'
    };

    // ─── Rating handlers ─────────────────────────────────────────────────────────

    onRatingChange(field: string, value: number) {
      (this.surveyData as any)[field] = value;
    }
    getRatingValue(field: string): number {
      return (this.surveyData as any)[field];
    }

    // ─── Experiences ─────────────────────────────────────────────────────────────

    onExperienceChange(experience: string, isChecked: boolean) {
      if (isChecked) {
        if (experience === 'None') {
          this.surveyData.experiences = ['None'];
        } else {
          this.surveyData.experiences = this.surveyData.experiences.filter(e => e !== 'None');
          this.surveyData.experiences.push(experience);
        }
      } else {
        this.surveyData.experiences = this.surveyData.experiences.filter(e => e !== experience);
      }
    }
    isExperienceSelected(experience: string) {
      return this.surveyData.experiences.includes(experience);
    }

    // ─── Validation ──────────────────────────────────────────────────────────────

    isFormValid(): boolean {
      const req = [
        'sleep_hours','interest_rate','position','screen_time','acad_pressure',
        'difficulty_falling_asleep','waking_up','diff_back_to_sleep','toss_turn',
        'unrefreshed','head_aches','irritated','intervenes','getting_out_of_bed',
        'concentration','temp','ventilation','noise_level','lighting'
      ];
      const allFilled = req.every(f => {
        const v = (this.surveyData as any)[f];
        return v !== null && v !== undefined && v !== '';
      });
      return allFilled && this.surveyData.experiences.length > 0;
    }

    // ─── Build payload ───────────────────────────────────────────────────────────

    private prepareDataForAPI() {
      // 1) Start with the simple string fields:
      const payload: any = {
        sleep_hours: this.surveyData.sleep_hours,
        interest_rate: this.interestMap[this.surveyData.interest_rate!],
        position: this.surveyData.position,
        screen_time: this.surveyData.screen_time,
        acad_pressure: this.surveyData.acad_pressure,
        temp: this.contextualMap[this.surveyData.temp!],
        ventilation: this.contextualMap[this.surveyData.ventilation!],
        noise_level: this.contextualMap[this.surveyData.noise_level!],
        lighting: this.contextualMap[this.surveyData.lighting!],
        // join experiences into one comma-separated string
        experiences: this.surveyData.experiences.join(', ')
      };

      // 2) Map each SQS numeric field to its label:
      const sqsFields = [
        'difficulty_falling_asleep', 'waking_up', 'diff_back_to_sleep',
        'toss_turn', 'unrefreshed', 'head_aches', 'irritated',
        'intervenes', 'getting_out_of_bed', 'concentration'
      ] as const;

      for (const field of sqsFields) {
        const num = (this.surveyData as any)[field] as number;
        payload[field] = this.sqsMap[num];
      }

      return payload;
    }

    // ─── Submission ──────────────────────────────────────────────────────────────

    async onSubmit() {
      if (!this.isFormValid()) {
        await this.toastCtrl.create({ message: 'Please fill in all fields', duration: 2000, color: 'warning' }).then(t => t.present());
        return;
      }

      // optional: test connection…
      const loading = await this.loadingCtrl.create({ message: 'Sending…' });
      await loading.present();

      try {
        const body = this.prepareDataForAPI();
        console.log('Payload →', body);

        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const res = await this.http.post<{ prediction: string }>(
          this.API_URL, body, { headers }
        ).toPromise();

        await loading.dismiss();
        if (res?.prediction) {
          await this.alertCtrl.create({
            header: 'Result', message: res.prediction, buttons: ['OK']
          }).then(a => a.present());
        }
      } catch (err) {
        await loading.dismiss();
        console.error(err);
        await this.toastCtrl.create({ message: 'Error sending data', duration: 2000, color: 'danger' }).then(t => t.present());
      }
    }
  }
