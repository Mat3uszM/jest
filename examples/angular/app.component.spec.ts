import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {describe, expect, it, jest} from '@jest/globals';

import {AppComponent} from './app.component';
import {DataService} from './shared/data.service';

const title = 'Test';
const getTitleFn = jest.fn<DataService['getTitle']>().mockReturnValue(title);
const dataServiceSpy = jest.fn().mockImplementation(
  (): Partial<DataService> => ({
    getTitle: getTitleFn,
  }),
);

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let app: AppComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [{provide: DataService, useClass: dataServiceSpy}],
    }).compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    app = fixture.debugElement.componentInstance;
  }));

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it("should have as title 'angular'", () => {
    expect(app.title).toEqual(title);
  });

  it('should render title in a h1 tag', () => {
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain(
      `Welcome to ${title}!`,
    );
  });
});
