import CredentialsBaseScene from './CredentialsBaseScene';
import { postData, refreshTokenInterval } from '../utils/utils';

export default class LoginScene extends CredentialsBaseScene {
  constructor() {
    super('Login');
  }

  create() {
    this.createUi('Login', this.login.bind(this), 'Back', this.startScene.bind(this, 'Title'));// , 'Forgot Password', this.startScene.bind(this, 'ForgotPassword')
  }

  login() {
    const loginValue = this.loginInput.value;
    const passwordValue = this.passwordInput.value;

    if (loginValue && passwordValue) {
      postData(`${SERVER_URL}/login`, { email: loginValue, password: passwordValue })
        .then((response) => {
          if (response.status === 200) {
            refreshTokenInterval();
            this.startScene('Game');
          } else {
            console.log(response.error);
            window.alert('Invalid username or password.');
          }
        })
        .catch((error) => {
          console.log(error.message);
          window.alert('Invalid username or password.');
        });
    } else {
      window.alert('all fields must be filled out');
    }
  }
}
