import { getSubgraphUrl, POOL_ID } from '@snx-v3/constants';
import { fetchApr } from '@snx-v3/useApr';
import { ARBITRUM, BASE_ANDROMEDA, MAINNET, NETWORKS } from '@snx-v3/useBlockchain';
import { useQuery } from '@tanstack/react-query';

export function usePoolsList() {
  return useQuery({
    queryKey: ['poolsList'],
    queryFn: async () => {
      try {
        const [pools, aprs] = await Promise.all([fetchPoolsList(), fetchAprs()]);

        const synthetixPools = pools.map((p, i) => ({
          ...p,
          apr: aprs[i],
        }));

        return { synthetixPools };
      } catch (error) {
        throw error;
      }
    },
    staleTime: 60000 * 10,
  });
}

export function usePool(networkId?: number) {
  const { data, isPending } = usePoolsList();

  return {
    data: data?.synthetixPools.find(
      (p) => p?.network?.id === networkId && p?.poolInfo?.[0]?.pool?.id === POOL_ID
    ),
    isPending,
  };
}

const supportedNetworks = [MAINNET.id, BASE_ANDROMEDA.id, ARBITRUM.id];

export const networksOffline = NETWORKS.filter(
  (n) => supportedNetworks.includes(n.id) && n.isSupported
).map((n) => n);

async function fetchAprs() {
  return Promise.all(networksOffline.map((network) => fetchApr(network.id)));
}

async function fetchPoolsList() {
  const urls = networksOffline.map((network) => getSubgraphUrl(network.name));

  // Fetch all the pools from the subgraphs
  const responses = await Promise.all(
    urls.map((url) =>
      fetch(url, { method: 'POST', body: JSON.stringify({ query: PoolsListData }) }).then((res) =>
        res.json()
      )
    )
  );

  return responses.map((response, i) => ({
    network: networksOffline[i],
    poolInfo: (response?.data?.vaults ?? []) as PoolInfo[],
  }));
}

const gql = (data: TemplateStringsArray) => data[0];

const PoolsListData = gql`
  query PoolsListData {
    vaults(where: { pool: "1" }) {
      collateral_type {
        id
        oracle_node_id
        total_amount_deposited
      }
      pool {
        name
        id
      }
    }
  }
`;

interface PoolInfo {
  collateral_type: {
    id: string;
    oracle_node_id: string;
    total_amount_deposited: string;
  };
  pool: {
    name: string;
    id: string;
  };
}
