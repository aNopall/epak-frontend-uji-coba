import FuseUtils from '@fuse/utils/FuseUtils';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { LoginQuery, RefreshTokenQuery, UserSettingQuery } from '../../../queries/Auth';
/* eslint-disable camelcase */

class JwtService extends FuseUtils.EventEmitter {
  init() {
    this.setInterceptors();
    this.handleAuthentication();
  }

  setInterceptors = () => {
    axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (err) => {
        return new Promise((resolve, reject) => {
          if (err.response.status === 401 && err.config && !err.config.__isRetryRequest) {
            // if you ever get an unauthorized response, logout the user
            this.emit('onAutoLogout', 'Invalid access_token');
            // this.setSession(null);
          }
          throw err;
        });
      }
    );
  };

  handleAuthentication = () => {
    const access_token = this.getAccessToken();

    if (!access_token) {
      this.emit('onNoAccessToken');

      return;
    }

    if (this.isAuthTokenValid(access_token)) {
      this.setSession(access_token);
      this.emit('onAutoLogin', true);
    } else {
      this.setSession(null);
      this.emit('onAutoLogout', 'access_token expired');
    }
  };

  createUser = (data) => {
    return new Promise((resolve, reject) => {
      axios.post('/graphql/system', data).then((response) => {
        if (response.data.user) {
          this.setSession(response.data.access_token);
          resolve(response.data.user);
        } else {
          reject(response.data.error);
        }
      });
    });
  };

  signInWithEmailAndPassword = (email, password) => {
    return new Promise((resolve, reject) => {
      axios
        .post('/graphql/system', {
          query: LoginQuery,
          variables: { email, password },
        })
        .then((response) => {
          if (response.data.data.auth_login) {
            this.setSession(response.data.data.auth_login.access_token);
            axios.defaults.headers.common.Authorization = `Bearer ${response.data.data.auth_login.access_token}`;
            axios.post('/graphql', { query: UserSettingQuery }).then((response2) => {
              resolve(this.createUserVariable(response2));
            });
            // resolve(response.data.user);
          } else {
            reject(response.data.errors);
          }
        });
    });
  };

  signInWithToken = () => {
    return new Promise((resolve, reject) => {
      axios.defaults.headers.common.Authorization = `Bearer ${this.getAccessToken()}`;
      axios
        .post('/graphql', { query: UserSettingQuery })
        .then((response2) => {
          resolve(this.createUserVariable(response2));
        })
        .catch((error) => {
          this.logout();
          reject(new Error('Failed to login with token.'));
        });
    });
  };

  updateUserData = (user) => {
    return axios.post('/api/auth/user/update', {
      user,
    });
  };

  setSession = (access_token) => {
    if (access_token) {
      localStorage.setItem('jwt_access_token', access_token);
      axios.defaults.headers.common.Authorization = `Bearer ${access_token}`;
    } else {
      localStorage.removeItem('jwt_access_token');
      delete axios.defaults.headers.common.Authorization;
    }
  };

  logout = () => {
    this.setSession(null);
  };

  isAuthTokenValid = (access_token) => {
    if (!access_token) {
      return false;
    }
    const decoded = jwtDecode(access_token);
    // console.log(decoded);
    const currentTime = Date.now() / 1000;
    if (parseInt(decoded.exp, 10) < currentTime) {
      // console.warn('access token expired');
      // console.warn('refresh token');
      delete axios.defaults.headers.common.Authorization;
      axios.defaults.withCredentials = true;
      return new Promise((resolve, reject) => {
        axios
          .post('/graphql/system', { RefreshTokenQuery })
          .then((response) => {
            console.log(response);
            if (response.data) {
              axios.defaults.headers.common.Authorization = `Bearer ${response.data.data.access_token}`;
              this.setSession(response.data.data.access_token);
              // console.log(true);
              resolve(true);
            } else {
              reject(response.data);
            }
            // console.log('abc');
            return false;
          })
          .catch((error) => {
            this.setSession(null);
            this.logout();
            reject(error);
            return false;
          });
      });
    }
    return true;
  };

  getAccessToken = () => {
    return window.localStorage.getItem('jwt_access_token');
  };

  createUserVariable = (response) => {
    // const menu =
    // console.log(response.data.data.settings[0]);
    const setting = response.data.data.settings[0];
    const { user } = setting;
    const role = setting.user.role.name;
    const { style, navbar } = setting;
    const userVariable = {
      form: 'api-direcus',
      role,
      data: {
        ...user,
        displayName: user.first_name,
        settings: {
          layout: {
            style,
            config: {
              scroll: 'content',
              navbar: {
                display: navbar,
                folded: true,
                position: setting.navbar_posisi,
              },
              toolbar: {
                display: true,
                style: 'fixed',
                position: 'below',
              },
              footer: {
                display: true,
                style: 'fixed',
                position: 'below',
              },
              mode: 'fullwidth',
            },
          },
          customScrollbars: true,
          theme: {
            main: 'legacy',
            navbar: 'dark6',
            toolbar: 'legacy',
            footer: 'legacy',
          },
        },
      },
    };
    return userVariable;
  };

  getMenu = () => {
    return window.localStorage.getItem('jwt_access_token');
  };
}

const instance = new JwtService();

export default instance;
