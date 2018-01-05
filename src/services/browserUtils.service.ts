import * as tldjs from 'tldjs';
import { DeviceType } from '../enums/deviceType.enum';
import { PlatformUtilsService as PlatformUtilsServiceInterface } from './abstractions/platformUtils.service';

const AnalyticsIds = {
    [DeviceType.Chrome]: 'UA-81915606-6',
    [DeviceType.Firefox]: 'UA-81915606-7',
    [DeviceType.Opera]: 'UA-81915606-8',
    [DeviceType.Edge]: 'UA-81915606-9',
    [DeviceType.Vivaldi]: 'UA-81915606-15',
    [DeviceType.Safari]: 'UA-81915606-16',
};

export default class BrowserUtilsService implements PlatformUtilsServiceInterface {
    static getDomain(uriString: string): string {
        if (uriString == null) {
            return null;
        }

        uriString = uriString.trim();
        if (uriString === '') {
            return null;
        }

        if (uriString.startsWith('http://') || uriString.startsWith('https://')) {
            try {
                const url = new URL(uriString);

                if (url.hostname === 'localhost' || BrowserUtilsService.validIpAddress(url.hostname)) {
                    return url.hostname;
                }

                const urlDomain = tldjs.getDomain(url.hostname);
                return urlDomain != null ? urlDomain : url.hostname;
            } catch (e) { }
        }

        const domain = tldjs.getDomain(uriString);
        if (domain != null) {
            return domain;
        }

        return null;
    }

    private static validIpAddress(ipString: string): boolean {
        // tslint:disable-next-line
        const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ipString);
    }

    private deviceCache: DeviceType = null;
    private analyticsIdCache: string = null;

    getDevice(): DeviceType {
        if (this.deviceCache) {
            return this.deviceCache;
        }

        if (navigator.userAgent.indexOf('Firefox') !== -1 || navigator.userAgent.indexOf('Gecko/') !== -1) {
            this.deviceCache = DeviceType.Firefox;
        } else if ((!!(window as any).opr && !!opr.addons) || !!(window as any).opera ||
            navigator.userAgent.indexOf(' OPR/') >= 0) {
            this.deviceCache = DeviceType.Opera;
        } else if (navigator.userAgent.indexOf(' Edge/') !== -1) {
            this.deviceCache = DeviceType.Edge;
        } else if (navigator.userAgent.indexOf(' Vivaldi/') !== -1) {
            this.deviceCache = DeviceType.Vivaldi;
        } else if ((window as any).chrome) {
            this.deviceCache = DeviceType.Chrome;
        }

        return this.deviceCache;
    }

    getDeviceString(): string {
        return DeviceType[this.getDevice()].toLowerCase();
    }

    isFirefox(): boolean {
        return this.getDevice() === DeviceType.Firefox;
    }

    isChrome(): boolean {
        return this.getDevice() === DeviceType.Chrome;
    }

    isEdge(): boolean {
        return this.getDevice() === DeviceType.Edge;
    }

    isOpera(): boolean {
        return this.getDevice() === DeviceType.Opera;
    }

    isVivaldi(): boolean {
        return this.getDevice() === DeviceType.Vivaldi;
    }

    isSafari(): boolean {
        return this.getDevice() === DeviceType.Safari;
    }

    analyticsId(): string {
        if (this.analyticsIdCache) {
            return this.analyticsIdCache;
        }

        this.analyticsIdCache = AnalyticsIds[this.getDevice()];
        return this.analyticsIdCache;
    }

    initListSectionItemListeners(doc: Document, angular: any): void {
        if (!doc) {
            throw new Error('doc parameter required');
        }

        const sectionItems = doc.querySelectorAll(
            '.list-section-item:not([data-bw-events="1"])');
        const sectionFormItems = doc.querySelectorAll(
            '.list-section-item:not([data-bw-events="1"]) input, ' +
            '.list-section-item:not([data-bw-events="1"]) select, ' +
            '.list-section-item:not([data-bw-events="1"]) textarea');

        sectionItems.forEach((item) => {
            (item as HTMLElement).dataset.bwEvents = '1';

            item.addEventListener('click', (e) => {
                if (e.defaultPrevented) {
                    return;
                }

                const el = e.target as HTMLElement;

                // Some elements will already focus properly
                if (el.tagName != null) {
                    switch (el.tagName.toLowerCase()) {
                        case 'label': case 'input': case 'textarea': case 'select':
                            return;
                        default:
                            break;
                    }
                }

                const cell = el.closest('.list-section-item');
                if (!cell) {
                    return;
                }

                const textFilter = 'input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"])';
                const text = cell.querySelectorAll(textFilter + ', textarea');
                const checkbox = cell.querySelectorAll('input[type="checkbox"]');
                const select = cell.querySelectorAll('select');

                if (text.length > 0) {
                    (text[0] as HTMLElement).focus();
                } else if (select.length > 0) {
                    (select[0] as HTMLElement).focus();
                } else if (checkbox.length > 0) {
                    const cb = checkbox[0] as HTMLInputElement;
                    cb.checked = !cb.checked;
                    if (angular) {
                        angular.element(checkbox[0]).triggerHandler('click');
                    }
                }
            }, false);
        });

        sectionFormItems.forEach((item) => {
            const itemCell = item.closest('.list-section-item');
            (itemCell as HTMLElement).dataset.bwEvents = '1';

            item.addEventListener('focus', (e: Event) => {
                const el = e.target as HTMLElement;
                const cell = el.closest('.list-section-item');
                if (!cell) {
                    return;
                }

                cell.classList.add('active');
            }, false);

            item.addEventListener('blur', (e: Event) => {
                const el = e.target as HTMLElement;
                const cell = el.closest('.list-section-item');
                if (!cell) {
                    return;
                }

                cell.classList.remove('active');
            }, false);
        });
    }

    getDomain(uriString: string): string {
        return BrowserUtilsService.getDomain(uriString);
    }

    inSidebar(theWindow: Window): boolean {
        return theWindow.location.search !== '' && theWindow.location.search.indexOf('uilocation=sidebar') > -1;
    }

    inTab(theWindow: Window): boolean {
        return theWindow.location.search !== '' && theWindow.location.search.indexOf('uilocation=tab') > -1;
    }

    inPopout(theWindow: Window): boolean {
        return theWindow.location.search !== '' && theWindow.location.search.indexOf('uilocation=popout') > -1;
    }

    inPopup(theWindow: Window): boolean {
        return theWindow.location.search === '' || theWindow.location.search.indexOf('uilocation=') === -1 ||
            theWindow.location.search.indexOf('uilocation=popup') > -1;
    }

    isViewOpen(): boolean {
        const popupOpen = chrome.extension.getViews({ type: 'popup' }).length > 0;
        if (popupOpen) {
            return true;
        }

        const sidebarView = this.sidebarViewName();
        const sidebarOpen = sidebarView != null && chrome.extension.getViews({ type: sidebarView }).length > 0;
        if (sidebarOpen) {
            return true;
        }

        const tabOpen = chrome.extension.getViews({ type: 'tab' }).length > 0;
        return tabOpen;
    }

    private sidebarViewName(): string {
        if ((window as any).chrome.sidebarAction && this.isFirefox()) {
            return 'sidebar';
        } else if (this.isOpera() && (typeof opr !== 'undefined') && opr.sidebarAction) {
            return 'sidebar_panel';
        }

        return null;
    }
}
