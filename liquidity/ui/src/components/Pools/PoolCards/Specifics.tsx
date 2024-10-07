import { Flex, Text, Tooltip } from '@chakra-ui/react';
import { isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { Network } from '@snx-v3/useBlockchain';

export const Specifics: React.FC<{
  network?: Network;
  isToros?: boolean;
  collateral?: string;
}> = ({ network, isToros, collateral }) => {
  const isBase = isBaseAndromeda(network?.id, network?.preset);

  if (isToros) {
    return (
      <Flex alignItems="center" gap={2}>
        {collateral?.toUpperCase() === 'wstETH'.toUpperCase() && (
          <Tooltip textAlign="left" label="Yield on yield" hasArrow>
            <svg
              width="15"
              height="20"
              viewBox="0 0 15 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14.75 0.25V1C14.75 2.77196 14.3798 4.34748 13.5301 5.58602C12.7165 6.77204 11.5079 7.58328 9.93146 7.97585C9.92778 7.19348 9.80594 6.88671 9.715 6.65775C9.69278 6.6018 9.6724 6.55049 9.65605 6.49803C10.874 6.1769 11.7254 5.56518 12.2932 4.73746C12.8164 3.9749 13.1334 2.97787 13.2234 1.75H13C11.1969 1.75 9.6271 2.75473 8.82235 4.23727C8.43446 3.61825 8.21504 3.35622 7.82135 3C8.94447 1.34139 10.8442 0.25 13 0.25H14.75ZM2.5 2.25H0.75V3C0.75 5.11524 1.27886 6.95375 2.51724 8.26497C3.62925 9.44239 5.22292 10.0995 7.25 10.227V14.0471C6.71977 14.1139 6.19971 14.2513 5.7039 14.4567C4.97595 14.7583 4.31451 15.2002 3.75736 15.7574C3.20021 16.3145 2.75825 16.9759 2.45672 17.7039C2.34927 17.9633 2.26041 18.2293 2.19052 18.5C2.0643 18.9889 2 19.4928 2 20H14C14 19.4928 13.9357 18.9889 13.8095 18.5C13.7396 18.2293 13.6507 17.9633 13.5433 17.7039C13.2417 16.9759 12.7998 16.3145 12.2426 15.7574C11.6855 15.2002 11.0241 14.7583 10.2961 14.4567C9.80029 14.2513 9.28023 14.1139 8.75 14.0471V8.5C8.75 5.04822 5.95178 2.25 2.5 2.25ZM7.25 8.5V8.72377C5.54931 8.60061 4.37854 8.05115 3.60776 7.23503C2.84294 6.42522 2.38729 5.26367 2.27653 3.75H2.5C5.12335 3.75 7.25 5.87665 7.25 8.5ZM12.1575 18.2779C12.1878 18.3513 12.2162 18.4253 12.2426 18.5H3.75736C3.78376 18.4253 3.81216 18.3513 3.84254 18.2779C4.06869 17.732 4.40016 17.2359 4.81802 16.818C5.23588 16.4002 5.73196 16.0687 6.27792 15.8425C6.82389 15.6164 7.40905 15.5 8 15.5C8.59095 15.5 9.17611 15.6164 9.72208 15.8425C10.268 16.0687 10.7641 16.4002 11.182 16.818C11.5998 17.2359 11.9313 17.732 12.1575 18.2779Z"
                fill="white"
              />
            </svg>
          </Tooltip>
        )}
        <Tooltip textAlign="left" label="Auto compounding rewards" hasArrow>
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M13.0174 5.43933L15.5565 5.4607L15.0114 4.65886C14.199 3.44599 13.0368 2.5094 11.6789 1.97498C10.3209 1.44054 8.83247 1.33405 7.41236 1.66991C5.9923 2.00576 4.70896 2.76772 3.73297 3.85315C3.07438 4.58558 2.57681 5.44183 2.26542 6.36621L1.01824 5.51595C2.28007 2.28873 5.41556 4.87321e-06 9.05782 5.23486e-06C10.3077 -0.00137571 11.5437 0.270478 12.6786 0.796884C13.3279 1.09804 14.2005 1.79177 14.8284 2.33033C15.3725 2.79694 15.8344 3.34704 16.238 3.93781L16.5875 4.44947V1.79811H18V6.87641H13.0174V5.43933Z"
              fill="white"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M4.98265 12.5607L2.44347 12.5393L2.98862 13.3411C3.801 14.554 4.96324 15.4906 6.32114 16.025C7.67912 16.5595 9.16753 16.666 10.5876 16.3301C12.0077 15.9942 13.291 15.2323 14.267 14.1469C14.9256 13.4144 15.4232 12.5582 15.7346 11.6338L16.9818 12.484C15.7199 15.7113 12.5844 18 8.94218 18C7.69234 18.0014 6.45634 17.7295 5.3214 17.2031C4.67209 16.902 3.79947 16.2082 3.17156 15.6697C2.62753 15.2031 2.16563 14.653 1.76203 14.0622L1.41246 13.5505V16.2019H0V11.1236H4.98265V12.5607Z"
              fill="white"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8.15203 7.43259C8.15749 7.17392 8.23184 7.06855 8.2819 7.01839C8.34795 6.9522 8.47557 6.8811 8.71189 6.84375C9.20433 6.76593 9.87038 6.87923 10.42 7.02301L11.0951 7.19961L11.4508 5.8585L10.7756 5.6819C10.1959 5.53025 9.28981 5.34813 8.49247 5.47415C8.08389 5.53872 7.63721 5.69436 7.29017 6.04213C6.92908 6.40398 6.75541 6.89352 6.75541 7.46324V7.48949L6.75741 7.51568C6.80774 8.17482 7.2026 8.61291 7.61215 8.90098C7.9876 9.16507 8.453 9.35742 8.82896 9.51279C8.84315 9.51866 8.85721 9.52447 8.87114 9.53023C9.2958 9.70592 9.61093 9.84124 9.82934 10.0001C10.0216 10.14 10.0408 10.2246 10.0408 10.2993C10.0408 10.589 9.95496 10.7041 9.88771 10.7645C9.79772 10.8453 9.62873 10.9241 9.34044 10.9598C8.75321 11.0324 7.99039 10.8896 7.42884 10.7403L6.75445 10.5609L6.39323 11.9005L7.06761 12.0799C7.66109 12.2377 8.64365 12.4435 9.51303 12.336C9.95306 12.2815 10.4402 12.138 10.8242 11.7931C11.231 11.4277 11.4371 10.9136 11.4371 10.2993C11.4371 9.62952 11.0601 9.17643 10.6544 8.8813C10.2852 8.61267 9.81651 8.4189 9.43937 8.26297C9.42885 8.25862 9.4184 8.2543 9.40803 8.25001C8.98398 8.07458 8.65635 7.93607 8.41913 7.76921C8.21793 7.62769 8.1647 7.52425 8.15203 7.43259Z"
              fill="white"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8.9936 11.3259C9.37918 11.3259 9.69176 11.6363 9.69176 12.0193V13.7528H8.29545V12.0193C8.29545 11.6363 8.60803 11.3259 8.9936 11.3259Z"
              fill="white"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9.69176 4.04495V5.77849C9.69176 6.16146 9.37918 6.47191 8.9936 6.47191C8.60803 6.47191 8.29545 6.16146 8.29545 5.77849V4.04495H9.69176Z"
              fill="white"
            />
          </svg>
        </Tooltip>
      </Flex>
    );
  }

  if (isBase) {
    if (collateral?.toUpperCase() === 'stataUSDC'.toUpperCase()) {
      return (
        <Tooltip textAlign="left" label="Yield on yield" hasArrow>
          <svg
            width="15"
            height="20"
            viewBox="0 0 15 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M14.75 0.25V1C14.75 2.77196 14.3798 4.34748 13.5301 5.58602C12.7165 6.77204 11.5079 7.58328 9.93146 7.97585C9.92778 7.19348 9.80594 6.88671 9.715 6.65775C9.69278 6.6018 9.6724 6.55049 9.65605 6.49803C10.874 6.1769 11.7254 5.56518 12.2932 4.73746C12.8164 3.9749 13.1334 2.97787 13.2234 1.75H13C11.1969 1.75 9.6271 2.75473 8.82235 4.23727C8.43446 3.61825 8.21504 3.35622 7.82135 3C8.94447 1.34139 10.8442 0.25 13 0.25H14.75ZM2.5 2.25H0.75V3C0.75 5.11524 1.27886 6.95375 2.51724 8.26497C3.62925 9.44239 5.22292 10.0995 7.25 10.227V14.0471C6.71977 14.1139 6.19971 14.2513 5.7039 14.4567C4.97595 14.7583 4.31451 15.2002 3.75736 15.7574C3.20021 16.3145 2.75825 16.9759 2.45672 17.7039C2.34927 17.9633 2.26041 18.2293 2.19052 18.5C2.0643 18.9889 2 19.4928 2 20H14C14 19.4928 13.9357 18.9889 13.8095 18.5C13.7396 18.2293 13.6507 17.9633 13.5433 17.7039C13.2417 16.9759 12.7998 16.3145 12.2426 15.7574C11.6855 15.2002 11.0241 14.7583 10.2961 14.4567C9.80029 14.2513 9.28023 14.1139 8.75 14.0471V8.5C8.75 5.04822 5.95178 2.25 2.5 2.25ZM7.25 8.5V8.72377C5.54931 8.60061 4.37854 8.05115 3.60776 7.23503C2.84294 6.42522 2.38729 5.26367 2.27653 3.75H2.5C5.12335 3.75 7.25 5.87665 7.25 8.5ZM12.1575 18.2779C12.1878 18.3513 12.2162 18.4253 12.2426 18.5H3.75736C3.78376 18.4253 3.81216 18.3513 3.84254 18.2779C4.06869 17.732 4.40016 17.2359 4.81802 16.818C5.23588 16.4002 5.73196 16.0687 6.27792 15.8425C6.82389 15.6164 7.40905 15.5 8 15.5C8.59095 15.5 9.17611 15.6164 9.72208 15.8425C10.268 16.0687 10.7641 16.4002 11.182 16.818C11.5998 17.2359 11.9313 17.732 12.1575 18.2779Z"
              fill="white"
            />
          </svg>
        </Tooltip>
      );
    }

    return (
      <Text fontFamily="heading" fontSize="14px" lineHeight="20px" fontWeight={500} color="white">
        N/A
      </Text>
    );
  }

  return (
    <Tooltip textAlign="left" label="Interest free loan" hasArrow>
      <svg
        width="14"
        height="20"
        viewBox="0 0 14 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.44509 0.394593L7 0.0664062L6.55491 0.394593C4.84836 1.6529 3.22055 3.82713 2.02366 6.14401C0.827692 8.45912 0 11.0367 0 13.1482C0 15.211 0.767278 16.884 2.06527 18.0335C3.35213 19.1731 5.10272 19.7482 7 19.7482C8.88834 19.7482 10.6379 19.2031 11.9276 18.0897C13.2313 16.9642 14 15.3126 14 13.2482C14 11.1379 13.1731 8.5362 11.9779 6.197C10.7821 3.85674 9.15429 1.65485 7.44509 0.394593ZM1.5 13.1482C1.5 11.3698 2.21731 9.03736 3.35634 6.83247C4.18293 5.23239 5.19892 3.76279 6.25 2.66758V18.2116C4.96858 18.0839 3.86898 17.6271 3.05973 16.9105C2.10772 16.0675 1.5 14.8154 1.5 13.1482ZM7.75 18.2134C9.03848 18.0912 10.1398 17.6515 10.9474 16.9543C11.8937 16.1373 12.5 14.9139 12.5 13.2482C12.5 13.0369 12.4899 12.8175 12.4701 12.591L7.75 15.4222V18.2134ZM7.75 13.673V12.4229L11.9057 9.92948C12.0207 10.2932 12.1205 10.6516 12.2038 11.0016L7.75 13.673ZM7.75 10.6736L11.3839 8.49326C11.1635 7.95448 10.9149 7.41333 10.6421 6.87948C9.81513 5.2609 8.79954 3.77491 7.75 2.67273V10.6736Z"
          fill="white"
        />
      </svg>
    </Tooltip>
  );
};
