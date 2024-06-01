/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
  console.log(email, password);
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:8000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    console.log(res.data);
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/'); //to redirect to another page
      }, 1500); //after 1.5seconds
    }
  } catch (err) {
    // console.log(err.response.data);
    showAlert('error', err.response.data.message);
    console.log(err);
  }
};

export const logouts = async () => {
  console.log('OUTSIDE LOGOUT TRY');
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:8000/api/v1/users/logouts',
    });
    console.log('IN LOGOUT TRY');
    if (res.data.status == 'success') location.reload(true); //will reload the page from server (not from browser cache)
  } catch (err) {
    showAlert('error', 'Error logging out! Try again!');
  }
};

// const login = async (email, password) => {
//   try {
//     // const url = "http://localhost:3000/api/v1/users/login";
//     const url = 'http://127.0.0.1:8000/api/v1/users/login';
//     const res = await fetch(url, {
//       method: 'POST',
//       mode: 'cors',
//       cache: 'no-cache',
//       credentials: 'same-origin',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       redirect: 'follow',
//       referrerPolicy: 'no-referrer',
//       body: JSON.stringify({ email, password }),
//     });

//     if (res.status === 200) {
//       showAlert('success', 'Logged in successfully!');
//       window.setTimeout(() => {
//         location.assign('/'); //to redirect to another page
//       }, 1500); //after 1.5seconds
//     }
//   } catch (err) {
//     showAlert('error', err.response.data);
//     console.log(err);
//     // console.log(err.response.data);
//   }
// };
