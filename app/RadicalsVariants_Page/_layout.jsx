import RadicalsVariants from './radicalsVariants'

import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const RadicalsVariantsLayout = () => (
    <TopSlider
        tabs={[
            buildTab('radicalsVariants', RadicalsVariants, 'radicals_variants'),
        ]}
    />
)

export default RadicalsVariantsLayout
