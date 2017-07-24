import { AngularOpenlayersPage } from './app.po';

describe('angular-openlayers App', () => {
  let page: AngularOpenlayersPage;

  beforeEach(() => {
    page = new AngularOpenlayersPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
