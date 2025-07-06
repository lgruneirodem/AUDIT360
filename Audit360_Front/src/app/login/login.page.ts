import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators,FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service'; 

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule,ReactiveFormsModule]
})
export class LoginPage implements OnInit {

  loginForm!: FormGroup;
  showPassword: boolean = false;
  isLoading: boolean = false;
  showError: boolean = false;
  showSuccess: boolean = false;
  errorMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private authService: AuthService
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    // Cualquier inicialización adicional
  }


    private initializeForm() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  async onLogin() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const { email, password, rememberMe } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: res => {
        localStorage.setItem('access_token', res.access);
        if (rememberMe) {
          localStorage.setItem('rememberUser', email);
        }

        this.showSuccess = true;
        setTimeout(() => {
          this.router.navigate(['/dashboard'], { replaceUrl: true });
        }, 1000);
      },
      error: err => {
        this.showErrorMessage('Credenciales inválidas o error del servidor.');
        this.loginForm.patchValue({ password: '' });
        this.loginForm.get('password')?.markAsUntouched();
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  private showErrorMessage(message: string) {
    this.errorMessage = message;
    this.showError = true;
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  async showForgotPassword() {
    const alert = await this.alertController.create({
      header: 'Recuperar contraseña',
      message: 'Ingresa tu correo electrónico para recibir instrucciones.',
      inputs: [
        { name: 'email', type: 'email', placeholder: 'tu@email.com' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar',
          handler: (data) => {
            if (data.email) this.sendPasswordReset(data.email);
          }
        }
      ]
    });

    await alert.present();
  }

  private async sendPasswordReset(email: string) {
    const loading = await this.loadingController.create({ message: 'Enviando...', duration: 2000 });
    await loading.present();

    setTimeout(async () => {
      await loading.dismiss();
      const toast = await this.toastController.create({
        message: 'Se han enviado las instrucciones a tu correo.',
        duration: 3000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    }, 2000);
  }

  // Getters para el formulario
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get rememberMe() {
    return this.loginForm.get('rememberMe');
  }
}

