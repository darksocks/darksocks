import { TestBed, inject } from '@angular/core/testing';
import { DarksocksService } from './darksocks.service';
import { MockIpcRenderer } from './darksocks.testdata';
declare var global: any;

describe('DarkSocksService', () => {
  beforeEach(() => {
    global.ipcRenderer = new MockIpcRenderer()
    TestBed.configureTestingModule({
      providers: [DarksocksService]
    });
  });

  it('should be created', inject([DarksocksService], (service: DarksocksService) => {
    expect(service).toBeTruthy();
  }));
});
