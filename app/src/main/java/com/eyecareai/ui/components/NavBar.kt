package com.eyecareai.ui.components

import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import com.eyecareai.R
import com.eyecareai.Screen

@Composable
fun NavBar(
    currentRoute: String,
    onNavigate: (String) -> Unit
) {
    val navItems = listOf(
        NavItem(
            route = Screen.Home.route,
            titleResId = R.string.nav_home,
            icon = "home"
        ),
        NavItem(
            route = Screen.LiveTracking.route,
            titleResId = R.string.nav_live_tracking,
            icon = "eye"
        ),
        NavItem(
            route = Screen.Reports.route,
            titleResId = R.string.nav_reports,
            icon = "bar-chart-2"
        ),
        NavItem(
            route = Screen.Settings.route,
            titleResId = R.string.nav_settings,
            icon = "settings"
        )
    )

    NavigationBar {
        navItems.forEach { item ->
            NavigationBarItem(
                icon = {
                    FeatherIcon(name = item.icon)
                },
                label = { Text(stringResource(id = item.titleResId)) },
                selected = currentRoute == item.route,
                onClick = { onNavigate(item.route) }
            )
        }
    }
}

@Composable
fun FeatherIcon(name: String) {
    // This is a simple wrapper around the actual icon implementation
    // In a real app, you would use a library like Feather Icons or custom SVG implementations
    when (name) {
        "home" -> Icon(
            imageVector = androidx.compose.material.icons.Icons.Filled.Home,
            contentDescription = "Home"
        )
        "eye" -> Icon(
            imageVector = androidx.compose.material.icons.Icons.Filled.Visibility,
            contentDescription = "Eye tracking"
        )
        "bar-chart-2" -> Icon(
            imageVector = androidx.compose.material.icons.Icons.Filled.Assessment,
            contentDescription = "Reports"
        )
        "settings" -> Icon(
            imageVector = androidx.compose.material.icons.Icons.Filled.Settings,
            contentDescription = "Settings"
        )
        else -> Icon(
            imageVector = androidx.compose.material.icons.Icons.Filled.Home,
            contentDescription = null
        )
    }
}

data class NavItem(
    val route: String,
    val titleResId: Int,
    val icon: String
)
