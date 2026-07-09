import RadicalsLevel2 from './radicalsLevel2'

import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const RadicalsLevel2Layout = () => (
    <TopSlider
        tabs={[
            buildTab('radicalsLevel2', RadicalsLevel2, 'radicals_level2'),
        ]}
    />
)

export default RadicalsLevel2Layout
