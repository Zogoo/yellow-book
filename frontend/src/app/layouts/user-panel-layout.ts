import { Component } from '@angular/core';

import { PanelLayout } from './panel-layout';

@Component({
  selector: 'app-user-panel-layout',
  imports: [PanelLayout],
  template: '<app-panel-layout kind="user" />',
})
export class UserPanelLayout {}
