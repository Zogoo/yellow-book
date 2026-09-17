import { Component } from '@angular/core';

import { PanelLayout } from './panel-layout';

@Component({
  selector: 'app-company-panel-layout',
  imports: [PanelLayout],
  template: '<app-panel-layout kind="company" />',
})
export class CompanyPanelLayout {}
