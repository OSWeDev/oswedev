import "bootstrap/dist/css/bootstrap.min.css";
import 'font-awesome/css/font-awesome.min.css';
import { Component } from "vue-property-decorator";
import "vue-snotify/styles/material.scss";
import "../scss/login-skin-print.scss";
import "../scss/login-skin.scss";
import './LoginVueMain.scss';
import VueComponentBase from '../../ts/components/VueComponentBase';

@Component({
    template: require('./LoginVueMain.pug')
})
export default class LoginVueMain extends VueComponentBase {
}