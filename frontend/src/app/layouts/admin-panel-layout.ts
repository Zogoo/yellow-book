import { Component } from '@angular/core';

import { PanelLayout } from './panel-layout';

@Component({
  selector: 'app-admin-panel-layout',
  imports: [PanelLayout],
  template: '<app-panel-layout kind="admin" />',
})
export class AdminPanelLayout {}
