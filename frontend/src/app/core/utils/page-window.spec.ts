import { pageWindow } from './page-window';

describe('pageWindow', () => {
  it('lists every page when there are few', () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('always offers the first and last page with gaps between', () => {
    expect(pageWindow(1, 84)).toEqual([1, 2, 3, null, 84]);
    expect(pageWindow(40, 84)).toEqual([1, null, 38, 39, 40, 41, 42, null, 84]);
    expect(pageWindow(84, 84)).toEqual([1, null, 82, 83, 84]);
  });
});
