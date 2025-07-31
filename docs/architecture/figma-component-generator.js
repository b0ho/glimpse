// Figma 컴포넌트 생성을 위한 스크립트
// 이 스크립트는 Figma Plugin API와 함께 사용됩니다

const components = {
  // Button Component
  Button: {
    variants: {
      type: ['primary', 'secondary', 'ghost'],
      size: ['small', 'medium', 'large'],
      state: ['default', 'hover', 'active', 'disabled']
    },
    properties: {
      primary: {
        default: {
          background: '#FF6B6B',
          color: '#FFFFFF',
          border: 'none'
        }
      },
      secondary: {
        default: {
          background: '#FFFFFF',
          color: '#FF6B6B',
          border: '1px solid #FF6B6B'
        }
      },
      ghost: {
        default: {
          background: 'transparent',
          color: '#FF6B6B',
          border: 'none'
        }
      }
    },
    sizes: {
      small: {
        padding: '8px 16px',
        fontSize: '14px',
        height: '32px'
      },
      medium: {
        padding: '12px 24px',
        fontSize: '16px',
        height: '44px'
      },
      large: {
        padding: '16px 32px',
        fontSize: '18px',
        height: '56px'
      }
    }
  },

  // Profile Card Component
  ProfileCard: {
    structure: {
      width: 345,
      height: 580,
      borderRadius: 16,
      shadow: 'lg'
    },
    elements: {
      image: {
        width: '100%',
        height: 400,
        borderRadius: '16px 16px 0 0',
        blur: 20 // for anonymous state
      },
      content: {
        padding: 16,
        elements: {
          nickname: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#212529'
          },
          info: {
            fontSize: 16,
            color: '#868E96',
            marginTop: 4
          },
          bio: {
            fontSize: 14,
            color: '#495057',
            marginTop: 12,
            lineHeight: 1.5
          }
        }
      }
    }
  },

  // Chat Bubble Component
  ChatBubble: {
    variants: {
      type: ['sent', 'received'],
      content: ['text', 'image', 'voice']
    },
    properties: {
      sent: {
        background: '#FF6B6B',
        color: '#FFFFFF',
        alignment: 'right',
        borderRadius: '16px 16px 4px 16px'
      },
      received: {
        background: '#F1F3F5',
        color: '#212529',
        alignment: 'left',
        borderRadius: '16px 16px 16px 4px'
      }
    },
    elements: {
      text: {
        padding: '12px 16px',
        maxWidth: 260
      },
      time: {
        fontSize: 12,
        color: '#868E96',
        marginTop: 4
      },
      readStatus: {
        fontSize: 12,
        color: '#339AF0'
      }
    }
  },

  // Tab Bar Component
  TabBar: {
    structure: {
      height: 60,
      background: '#FFFFFF',
      borderTop: '1px solid #E9ECEF'
    },
    items: [
      {
        icon: 'home',
        label: '홈',
        active: '#FF6B6B',
        inactive: '#6C757D'
      },
      {
        icon: 'groups',
        label: '그룹',
        active: '#FF6B6B',
        inactive: '#6C757D'
      },
      {
        icon: 'matches',
        label: '매칭',
        active: '#FF6B6B',
        inactive: '#6C757D'
      },
      {
        icon: 'profile',
        label: '프로필',
        active: '#FF6B6B',
        inactive: '#6C757D'
      }
    ]
  },

  // Input Field Component
  InputField: {
    variants: {
      type: ['text', 'phone', 'otp'],
      state: ['default', 'focus', 'error', 'success']
    },
    properties: {
      structure: {
        height: 48,
        padding: '12px 16px',
        borderRadius: 8,
        fontSize: 16
      },
      states: {
        default: {
          border: '1px solid #E9ECEF',
          background: '#FFFFFF'
        },
        focus: {
          border: '2px solid #FF6B6B',
          background: '#FFFFFF'
        },
        error: {
          border: '2px solid #FF6B6B',
          background: '#FFF5F5'
        },
        success: {
          border: '2px solid #51CF66',
          background: '#F3FFF5'
        }
      }
    }
  }
};

// Figma API를 사용한 컴포넌트 생성 함수
function createFigmaComponent(component, name) {
  console.log(`Creating ${name} component in Figma...`);
  console.log('Properties:', JSON.stringify(component, null, 2));
  
  // 이 코드를 Figma Plugin에서 실행하면 실제 컴포넌트가 생성됩니다
  // figma.createComponent()
  // figma.createRectangle()
  // figma.createText()
  // etc...
}

// 모든 컴포넌트 생성
Object.entries(components).forEach(([name, component]) => {
  createFigmaComponent(component, name);
});

console.log('\n✅ Figma 컴포넌트 정의가 완료되었습니다!');
console.log('이 스크립트를 Figma Plugin으로 변환하여 사용하세요.');