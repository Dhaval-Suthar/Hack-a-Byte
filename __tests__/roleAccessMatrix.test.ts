import { 
  isHackPhoneAppAllowed, 
  getAllowedHackPhoneApps, 
  getRolePermissionDescription,
  isDesktopAppAllowed,
  HACKPHONE_PERMISSION_MATRIX 
} from '@/lib/role-access-matrix';

describe('Role-Based Access Control System', () => {
  
  describe('HackPhone App Access Control', () => {
    
    // Test Team Size 1 (Professor only)
    describe('Team Size 1', () => {
      it('should allow professor full access to all apps', () => {
        const apps = ['settings', 'messages', 'mail', 'safari', 'appStore', 'sentinel', 'game', 'mining', 'stocks', 'calculator'];
        
        apps.forEach(app => {
          expect(isHackPhoneAppAllowed(app, 1, 'professor')).toBe(true);
        });
      });
    });

    // Test Team Size 2
    describe('Team Size 2', () => {
      it('should restrict professor access according to matrix', () => {
        // Professor in team size 2: [false, false, false, false, true, true, true, true, true, true]
        expect(isHackPhoneAppAllowed('settings', 2, 'professor')).toBe(false);
        expect(isHackPhoneAppAllowed('messages', 2, 'professor')).toBe(false);
        expect(isHackPhoneAppAllowed('mail', 2, 'professor')).toBe(false);
        expect(isHackPhoneAppAllowed('safari', 2, 'professor')).toBe(false);
        expect(isHackPhoneAppAllowed('appStore', 2, 'professor')).toBe(true);
        expect(isHackPhoneAppAllowed('sentinel', 2, 'professor')).toBe(true);
        expect(isHackPhoneAppAllowed('game', 2, 'professor')).toBe(true);
        expect(isHackPhoneAppAllowed('mining', 2, 'professor')).toBe(true);
        expect(isHackPhoneAppAllowed('stocks', 2, 'professor')).toBe(true);
        expect(isHackPhoneAppAllowed('calculator', 2, 'professor')).toBe(true); // other apps
      });

      it('should allow berlin access to communication apps', () => {
        // Berlin in team size 2: [true, true, true, true, false, false, false, false, false, true]
        expect(isHackPhoneAppAllowed('settings', 2, 'berlin')).toBe(true);
        expect(isHackPhoneAppAllowed('messages', 2, 'berlin')).toBe(true);
        expect(isHackPhoneAppAllowed('mail', 2, 'berlin')).toBe(true);
        expect(isHackPhoneAppAllowed('safari', 2, 'berlin')).toBe(true);
        expect(isHackPhoneAppAllowed('appStore', 2, 'berlin')).toBe(false);
        expect(isHackPhoneAppAllowed('sentinel', 2, 'berlin')).toBe(false);
        expect(isHackPhoneAppAllowed('game', 2, 'berlin')).toBe(false);
        expect(isHackPhoneAppAllowed('mining', 2, 'berlin')).toBe(false);
        expect(isHackPhoneAppAllowed('stocks', 2, 'berlin')).toBe(false);
        expect(isHackPhoneAppAllowed('calculator', 2, 'berlin')).toBe(true); // other apps
      });
    });

    // Test Team Size 4
    describe('Team Size 4', () => {
      it('should restrict professor to sentinel and stocks only', () => {
        // Professor in team size 4: [false, false, false, false, false, true, false, false, true, true]
        expect(isHackPhoneAppAllowed('settings', 4, 'professor')).toBe(false);
        expect(isHackPhoneAppAllowed('messages', 4, 'professor')).toBe(false);
        expect(isHackPhoneAppAllowed('mail', 4, 'professor')).toBe(false);
        expect(isHackPhoneAppAllowed('safari', 4, 'professor')).toBe(false);
        expect(isHackPhoneAppAllowed('appStore', 4, 'professor')).toBe(false);
        expect(isHackPhoneAppAllowed('sentinel', 4, 'professor')).toBe(true);
        expect(isHackPhoneAppAllowed('game', 4, 'professor')).toBe(false);
        expect(isHackPhoneAppAllowed('mining', 4, 'professor')).toBe(false);
        expect(isHackPhoneAppAllowed('stocks', 4, 'professor')).toBe(true);
        expect(isHackPhoneAppAllowed('calculator', 4, 'professor')).toBe(true); // other apps
      });

      it('should allow nairobi access to communication and mining apps', () => {
        // Nairobi in team size 4: [false, true, true, true, false, false, true, true, false, true]
        expect(isHackPhoneAppAllowed('settings', 4, 'nairobi')).toBe(false);
        expect(isHackPhoneAppAllowed('messages', 4, 'nairobi')).toBe(true);
        expect(isHackPhoneAppAllowed('mail', 4, 'nairobi')).toBe(true);
        expect(isHackPhoneAppAllowed('safari', 4, 'nairobi')).toBe(true);
        expect(isHackPhoneAppAllowed('appStore', 4, 'nairobi')).toBe(false);
        expect(isHackPhoneAppAllowed('sentinel', 4, 'nairobi')).toBe(false);
        expect(isHackPhoneAppAllowed('game', 4, 'nairobi')).toBe(true);
        expect(isHackPhoneAppAllowed('mining', 4, 'nairobi')).toBe(true);
        expect(isHackPhoneAppAllowed('stocks', 4, 'nairobi')).toBe(false);
        expect(isHackPhoneAppAllowed('calculator', 4, 'nairobi')).toBe(true); // other apps
      });

      it('should restrict rio to appStore only', () => {
        // Rio in team size 4: [false, false, false, false, true, false, false, false, false, true]
        expect(isHackPhoneAppAllowed('settings', 4, 'rio')).toBe(false);
        expect(isHackPhoneAppAllowed('messages', 4, 'rio')).toBe(false);
        expect(isHackPhoneAppAllowed('mail', 4, 'rio')).toBe(false);
        expect(isHackPhoneAppAllowed('safari', 4, 'rio')).toBe(false);
        expect(isHackPhoneAppAllowed('appStore', 4, 'rio')).toBe(true);
        expect(isHackPhoneAppAllowed('sentinel', 4, 'rio')).toBe(false);
        expect(isHackPhoneAppAllowed('game', 4, 'rio')).toBe(false);
        expect(isHackPhoneAppAllowed('mining', 4, 'rio')).toBe(false);
        expect(isHackPhoneAppAllowed('stocks', 4, 'rio')).toBe(false);
        expect(isHackPhoneAppAllowed('calculator', 4, 'rio')).toBe(true); // other apps
      });
    });

    // Test undefined roles
    it('should allow access when role/team data is not available', () => {
      expect(isHackPhoneAppAllowed('settings', 4, 'unknown_role')).toBe(true);
      expect(isHackPhoneAppAllowed('appStore', 999, 'professor')).toBe(true);
    });
  });

  describe('Desktop App Access Control', () => {
    it('should restrict Network Neighborhood to technical roles', () => {
      expect(isDesktopAppAllowed('Network Neighborhood', 'professor')).toBe(true);
      expect(isDesktopAppAllowed('Network Neighborhood', 'berlin')).toBe(true);
      expect(isDesktopAppAllowed('Network Neighborhood', 'nairobi')).toBe(true);
      expect(isDesktopAppAllowed('Network Neighborhood', 'denver')).toBe(true);
      expect(isDesktopAppAllowed('Network Neighborhood', 'rio')).toBe(false);
      expect(isDesktopAppAllowed('Network Neighborhood', 'tokyo')).toBe(false);
    });

    it('should restrict Neural Network Analyzer to attack roles', () => {
      expect(isDesktopAppAllowed('Neural Network Analyzer', 'professor')).toBe(true);
      expect(isDesktopAppAllowed('Neural Network Analyzer', 'rio')).toBe(true);
      expect(isDesktopAppAllowed('Neural Network Analyzer', 'tokyo')).toBe(true);
      expect(isDesktopAppAllowed('Neural Network Analyzer', 'berlin')).toBe(false);
      expect(isDesktopAppAllowed('Neural Network Analyzer', 'nairobi')).toBe(false);
      expect(isDesktopAppAllowed('Neural Network Analyzer', 'denver')).toBe(false);
    });

    it('should allow basic apps to all roles', () => {
      const basicApps = ['Calculator', 'Notepad', 'Paint', 'Minesweeper'];
      const allRoles = ['professor', 'berlin', 'rio', 'tokyo', 'nairobi', 'denver'];
      
      basicApps.forEach(app => {
        allRoles.forEach(role => {
          expect(isDesktopAppAllowed(app, role)).toBe(true);
        });
      });
    });

    it('should allow unrestricted apps by default', () => {
      expect(isDesktopAppAllowed('Unknown App', 'professor')).toBe(true);
      expect(isDesktopAppAllowed('Another App', 'rio')).toBe(true);
    });
  });

  describe('Permission Matrix Validation', () => {
    it('should have consistent matrix structure', () => {
      const teamSizes = [1, 2, 3, 4, 5, 6];
      
      teamSizes.forEach(size => {
        expect(HACKPHONE_PERMISSION_MATRIX[size]).toBeDefined();
        
        const roles = Object.keys(HACKPHONE_PERMISSION_MATRIX[size]);
        roles.forEach(role => {
          const permissions = HACKPHONE_PERMISSION_MATRIX[size][role];
          expect(permissions).toHaveLength(10); // 9 special apps + 1 "all others"
        });
      });
    });

    it('should provide accurate permission descriptions', () => {
      const description = getRolePermissionDescription(4, 'professor');
      expect(description).toContain('sentinel');
      expect(description).toContain('stocks');
      
      const nairobi4Desc = getRolePermissionDescription(4, 'nairobi');
      expect(nairobi4Desc).toContain('messages');
      expect(nairobi4Desc).toContain('mining');
    });
  });

  describe('Edge Cases', () => {
    it('should handle case-insensitive role names', () => {
      expect(isHackPhoneAppAllowed('appStore', 4, 'RIO')).toBe(true);
      expect(isHackPhoneAppAllowed('appStore', 4, 'Rio')).toBe(true);
      expect(isHackPhoneAppAllowed('appStore', 4, 'rio')).toBe(true);
    });

    it('should handle invalid team sizes gracefully', () => {
      expect(isHackPhoneAppAllowed('settings', 0, 'professor')).toBe(true);
      expect(isHackPhoneAppAllowed('settings', -1, 'professor')).toBe(true);
      expect(isHackPhoneAppAllowed('settings', 100, 'professor')).toBe(true);
    });

    it('should handle empty or null role names', () => {
      expect(isHackPhoneAppAllowed('settings', 4, '')).toBe(true);
      expect(isDesktopAppAllowed('Terminal', '')).toBe(true);
    });
  });
});