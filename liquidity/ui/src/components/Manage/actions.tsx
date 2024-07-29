export const COLLATERALACTIONS = [
  {
    title: 'Deposit & Lock',
    link: 'deposit',
    icon: (fill: 'white' | 'cyan') => (
      <svg
        width="37"
        height="36"
        viewBox="0 0 37 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.875 18C6.875 15.7218 8.72183 13.875 11 13.875H26C28.2782 13.875 30.125 15.7218 30.125 18V27C30.125 29.2782 28.2782 31.125 26 31.125H11C8.72183 31.125 6.875 29.2782 6.875 27V18ZM11 16.125C9.96447 16.125 9.125 16.9645 9.125 18V27C9.125 28.0355 9.96447 28.875 11 28.875H26C27.0355 28.875 27.875 28.0355 27.875 27V18C27.875 16.9645 27.0355 16.125 26 16.125H11Z"
          fill={fill === 'cyan' ? '#00D1FF' : 'white'}
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M11.375 12C11.375 8.06497 14.565 4.875 18.5 4.875C22.435 4.875 25.625 8.06497 25.625 12V16.125H11.375V12ZM18.5 7.125C15.8076 7.125 13.625 9.30761 13.625 12V13.875H23.375V12C23.375 9.30761 21.1924 7.125 18.5 7.125Z"
          fill={fill === 'cyan' ? '#00D1FF' : 'white'}
        />
      </svg>
    ),
  },
  {
    title: 'Unlock',
    link: 'undelegate',
    icon: (fill: 'white' | 'cyan') => (
      <svg
        width="32"
        height="28"
        viewBox="0 0 32 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0.375 14C0.375 11.7218 2.22183 9.875 4.5 9.875H19.5C21.7782 9.875 23.625 11.7218 23.625 14V23C23.625 25.2782 21.7782 27.125 19.5 27.125H4.5C2.22183 27.125 0.375 25.2782 0.375 23V14ZM4.5 12.125C3.46447 12.125 2.625 12.9645 2.625 14V23C2.625 24.0355 3.46447 24.875 4.5 24.875H19.5C20.5355 24.875 21.375 24.0355 21.375 23V14C21.375 12.9645 20.5355 12.125 19.5 12.125H4.5Z"
          fill={fill === 'cyan' ? '#00D1FF' : 'white'}
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M16.875 8C16.875 4.06497 20.065 0.875 24 0.875C27.935 0.875 31.125 4.06497 31.125 8V11H28.875V8C28.875 5.30761 26.6924 3.125 24 3.125C21.3076 3.125 19.125 5.30761 19.125 8V11H16.875V8Z"
          fill={fill === 'cyan' ? '#00D1FF' : 'white'}
        />
      </svg>
    ),
  },
  {
    title: 'Withdraw',
    link: 'withdraw',
    icon: (fill: 'white' | 'cyan') => (
      <svg
        width="37"
        height="36"
        viewBox="0 0 37 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6.60986 29.7349C6.60986 29.942 6.77776 30.1099 6.98486 30.1099L28.7349 30.1099C28.942 30.1099 29.1099 29.942 29.1099 29.7349L29.1099 21.1099L31.3599 21.1099L31.3599 29.7349C31.3599 31.1846 30.1846 32.3599 28.7349 32.3599L6.98486 32.3599C5.53512 32.3599 4.35986 31.1846 4.35986 29.7349L4.35986 21.1099L6.60986 21.1099L6.60986 22.2348L6.60986 29.7349Z"
          fill={fill === 'cyan' ? '#00D1FF' : 'white'}
        />
        <path
          d="M18.9849 26.7349L16.7349 26.7349L16.7349 7.94653L12.3555 12.3259L10.8728 10.6273L17.8599 3.64019L24.8469 10.6273L23.3643 12.3259L18.9849 7.94653L18.9849 26.7349Z"
          fill={fill === 'cyan' ? '#00D1FF' : 'white'}
        />
      </svg>
    ),
  },
];

export const DEBTACTIONS = (isBase: boolean) => {
  const actions = [
    {
      title: isBase ? 'Claim' : 'Claim/Borrow',
      link: 'claim',
      icon: (fill: 'white' | 'cyan') => (
        <svg
          width="37"
          height="36"
          viewBox="0 0 37 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_11314_79978)">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M16.0903 8.50714C9.39782 8.50714 3.97247 13.9325 3.97247 20.625C3.97247 27.3175 9.39782 32.7429 16.0903 32.7429C22.7828 32.7429 28.2082 27.3175 28.2082 20.625C28.2082 13.9325 22.7828 8.50714 16.0903 8.50714ZM1.46533 20.625C1.46533 12.5478 8.01317 6 16.0903 6C24.1675 6 30.7153 12.5478 30.7153 20.625C30.7153 28.7022 24.1675 35.25 16.0903 35.25C8.01317 35.25 1.46533 28.7022 1.46533 20.625Z"
              fill={fill === 'cyan' ? '#00D1FF' : 'white'}
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M14.5792 17.9742C14.589 17.5066 14.7225 17.3161 14.8124 17.2254C14.931 17.1058 15.1602 16.9772 15.5845 16.9097C16.4687 16.769 17.6646 16.9739 18.6515 17.2338L19.8638 17.553L20.5023 15.1286L19.29 14.8093C18.2491 14.5351 16.6222 14.2059 15.1905 14.4337C14.4569 14.5505 13.6548 14.8318 13.0317 15.4605C12.3834 16.1147 12.0715 16.9997 12.0715 18.0296V18.0771L12.0751 18.1244C12.1655 19.316 12.8745 20.108 13.6098 20.6288C14.284 21.1062 15.1197 21.4539 15.7947 21.7348C15.8202 21.7454 15.8454 21.7559 15.8704 21.7664C16.6329 22.084 17.1988 22.3286 17.591 22.6158C17.9362 22.8687 17.9707 23.0216 17.9707 23.1567C17.9707 23.6803 17.8165 23.8884 17.6957 23.9976C17.5342 24.1438 17.2307 24.2862 16.7131 24.3507C15.6587 24.482 14.289 24.2239 13.2807 23.9538L12.0698 23.6296L11.4212 26.0513L12.6321 26.3756C13.6977 26.661 15.462 27.0331 17.023 26.8386C17.8131 26.7402 18.6878 26.4808 19.3774 25.8572C20.1078 25.1967 20.4778 24.2672 20.4778 23.1567C20.4778 21.9459 19.8008 21.1267 19.0724 20.5932C18.4094 20.1076 17.5679 19.7573 16.8907 19.4754C16.8718 19.4675 16.8531 19.4597 16.8345 19.452C16.0731 19.1348 15.4848 18.8844 15.0588 18.5828C14.6976 18.3269 14.602 18.1399 14.5792 17.9742Z"
              fill={fill === 'cyan' ? '#00D1FF' : 'white'}
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M16.0903 25.0125C16.7827 25.0125 17.3439 25.5737 17.3439 26.2661V29.4H14.8368V26.2661C14.8368 25.5737 15.398 25.0125 16.0903 25.0125Z"
              fill={fill === 'cyan' ? '#00D1FF' : 'white'}
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M17.3439 11.85V14.9839C17.3439 15.6763 16.7827 16.2375 16.0903 16.2375C15.398 16.2375 14.8368 15.6763 14.8368 14.9839V11.85H17.3439Z"
              fill={fill === 'cyan' ? '#00D1FF' : 'white'}
            />
            <path
              d="M30.5 4.5V1.5H33.5V4.5H36.5V7.5H33.5V10.5H30.5V7.5H27.5V4.5H30.5Z"
              fill={fill === 'cyan' ? '#00D1FF' : 'white'}
            />
          </g>
          <defs>
            <clipPath id="clip0_11314_79978">
              <rect
                width="36"
                height="36"
                fill={fill === 'cyan' ? '#00D1FF' : 'white'}
                transform="translate(0.5)"
              />
            </clipPath>
          </defs>
        </svg>
      ),
    },
    {
      title: 'Repay Debt',
      link: 'repay',
      icon: (fill: 'white' | 'cyan') => (
        <svg
          width="37"
          height="36"
          viewBox="0 0 37 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_11314_79981)">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M16.0903 8.50714C9.39782 8.50714 3.97247 13.9325 3.97247 20.625C3.97247 27.3175 9.39782 32.7429 16.0903 32.7429C22.7828 32.7429 28.2082 27.3175 28.2082 20.625C28.2082 13.9325 22.7828 8.50714 16.0903 8.50714ZM1.46533 20.625C1.46533 12.5478 8.01317 6 16.0903 6C24.1675 6 30.7153 12.5478 30.7153 20.625C30.7153 28.7022 24.1675 35.25 16.0903 35.25C8.01317 35.25 1.46533 28.7022 1.46533 20.625Z"
              fill={fill === 'cyan' ? '#00D1FF' : 'white'}
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M14.5792 17.9742C14.589 17.5066 14.7225 17.3161 14.8124 17.2254C14.931 17.1058 15.1602 16.9772 15.5845 16.9097C16.4687 16.769 17.6646 16.9739 18.6515 17.2338L19.8638 17.553L20.5023 15.1286L19.29 14.8093C18.2491 14.5351 16.6222 14.2059 15.1905 14.4337C14.4569 14.5505 13.6548 14.8318 13.0317 15.4605C12.3834 16.1147 12.0715 16.9997 12.0715 18.0296V18.0771L12.0751 18.1244C12.1655 19.316 12.8745 20.108 13.6098 20.6288C14.284 21.1062 15.1197 21.4539 15.7947 21.7348C15.8202 21.7454 15.8454 21.7559 15.8704 21.7664C16.6329 22.084 17.1988 22.3286 17.591 22.6158C17.9362 22.8687 17.9707 23.0216 17.9707 23.1567C17.9707 23.6803 17.8165 23.8884 17.6957 23.9976C17.5342 24.1438 17.2307 24.2862 16.7131 24.3507C15.6587 24.482 14.289 24.2239 13.2807 23.9538L12.0698 23.6296L11.4212 26.0513L12.6321 26.3756C13.6977 26.661 15.462 27.0331 17.023 26.8386C17.8131 26.7402 18.6878 26.4808 19.3774 25.8572C20.1078 25.1967 20.4778 24.2672 20.4778 23.1567C20.4778 21.9459 19.8008 21.1267 19.0724 20.5932C18.4094 20.1076 17.5679 19.7573 16.8907 19.4754C16.8718 19.4675 16.8531 19.4597 16.8345 19.452C16.0731 19.1348 15.4848 18.8844 15.0588 18.5828C14.6976 18.3269 14.602 18.1399 14.5792 17.9742Z"
              fill={fill === 'cyan' ? '#00D1FF' : 'white'}
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M16.0903 25.0125C16.7827 25.0125 17.3439 25.5737 17.3439 26.2661V29.4H14.8368V26.2661C14.8368 25.5737 15.398 25.0125 16.0903 25.0125Z"
              fill={fill === 'cyan' ? '#00D1FF' : 'white'}
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M17.3439 11.85V14.9839C17.3439 15.6763 16.7827 16.2375 16.0903 16.2375C15.398 16.2375 14.8368 15.6763 14.8368 14.9839V11.85H17.3439Z"
              fill={fill === 'cyan' ? '#00D1FF' : 'white'}
            />
            <path
              d="M30.5 4.5H33.5H36.5V7.5H33.5H30.5H27.5V4.5H30.5Z"
              fill={fill === 'cyan' ? '#00D1FF' : 'white'}
            />
          </g>
          <defs>
            <clipPath id="clip0_11314_79981">
              <rect
                width="36"
                height="36"
                fill={fill === 'cyan' ? '#00D1FF' : 'white'}
                transform="translate(0.5)"
              />
            </clipPath>
          </defs>
        </svg>
      ),
    },
  ];

  if (isBase) {
    return actions;
  }

  return [
    ...actions,
    {
      title: 'Withdraw',
      link: 'withdraw-debt',
      icon: (fill: 'white' | 'cyan') => (
        <svg
          width="37"
          height="36"
          viewBox="0 0 37 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6.60986 29.7349C6.60986 29.942 6.77776 30.1099 6.98486 30.1099L28.7349 30.1099C28.942 30.1099 29.1099 29.942 29.1099 29.7349L29.1099 21.1099L31.3599 21.1099L31.3599 29.7349C31.3599 31.1846 30.1846 32.3599 28.7349 32.3599L6.98486 32.3599C5.53512 32.3599 4.35986 31.1846 4.35986 29.7349L4.35986 21.1099L6.60986 21.1099L6.60986 22.2348L6.60986 29.7349Z"
            fill={fill === 'cyan' ? '#00D1FF' : 'white'}
          />
          <path
            d="M18.9849 26.7349L16.7349 26.7349L16.7349 7.94653L12.3555 12.3259L10.8728 10.6273L17.8599 3.64019L24.8469 10.6273L23.3643 12.3259L18.9849 7.94653L18.9849 26.7349Z"
            fill={fill === 'cyan' ? '#00D1FF' : 'white'}
          />
        </svg>
      ),
    },
  ];
};