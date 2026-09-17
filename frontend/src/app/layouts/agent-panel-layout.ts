import { Component } from '@angular/core';

import { PanelLayout } from './panel-layout';

@Component({
  selector: 'app-agent-panel-layout',
  imports: [PanelLayout],
  template: '<app-panel-layout kind="agent" />',
})
export class AgentPanelLayout {}
